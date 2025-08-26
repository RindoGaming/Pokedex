<?php
$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon';
$batch_size = 10; // Number of Pokémon per batch
$total_pokemon = 386; // Total Pokémon to fetch, limit to gen 3

for ($start = 1; $start <= $total_pokemon; $start += $batch_size) {
    $multi_handle = curl_multi_init();
    $curl_handles = [];

    for ($i = 0; $i < $batch_size && ($start + $i) <= $total_pokemon; $i++) {
        $id = $start + $i;
        $pokeapi_url = "https://pokeapi.co/api/v2/pokemon/$id";
        $ch = curl_init($pokeapi_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_multi_add_handle($multi_handle, $ch);
        $curl_handles[$id] = $ch;
    }

    $running = null;
    do {
        curl_multi_exec($multi_handle, $running);
        curl_multi_select($multi_handle);
    } while ($running > 0);

    $batch_data = [];
    foreach ($curl_handles as $id => $ch) {
        $pokeapi_response = curl_multi_getcontent($ch);
        $pokeapi_data = json_decode($pokeapi_response, true);

        if ($pokeapi_data) {
            $abilities_structured = [];
            foreach ($pokeapi_data['abilities'] as $ability) {
                $ability_name = $ability['ability']['name'];
                $abilities_structured[$ability_name] = [
                    'is_hidden' => $ability['is_hidden'],
                    'slot' => $ability['slot']
                ];
            }

            $types_structured = [];
            foreach ($pokeapi_data['types'] as $type) {
                $type_name = $type['type']['name'];
                $types_structured[$type_name] = [
                    'slot' => $type['slot']
                ];
            }

            $image_url = $pokeapi_data['sprites']['front_default'] ?? null;
            $cry_url = "https://play.pokemonshowdown.com/audio/cries/" . strtolower($pokeapi_data['name']) . ".mp3";

            $filtered_data = [
                'id' => $pokeapi_data['id'],
                'name' => $pokeapi_data['name'],
                'types' => $types_structured,
                'abilities' => $abilities_structured,

                'height_decimetres' => $pokeapi_data['height'],
                'height_meters' => $pokeapi_data['height'] / 10,
                'weight_hectograms' => $pokeapi_data['weight'], 
                'weight_kilograms' => $pokeapi_data['weight'] / 10, 

                'image' => $image_url,
                'cry' => $cry_url
            ];

            $key = strtolower($pokeapi_data['name']);
            $batch_data[$key] = $filtered_data;
        }

        curl_multi_remove_handle($multi_handle, $ch);
        curl_close($ch);
    }

    $ids = array_map(function($pokemon) {
        return $pokemon['id'];
    }, $batch_data);

    $ch_firebase = curl_init();
    curl_setopt($ch_firebase, CURLOPT_URL, $firebase_url . '.json');
    curl_setopt($ch_firebase, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch_firebase, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch_firebase, CURLOPT_POSTFIELDS, json_encode($batch_data));
    curl_setopt($ch_firebase, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch_firebase);

    if ($response === false) {
        echo 'Curl error: ' . curl_error($ch_firebase);
    } else {
        echo "Batch added: IDs " . min($ids) . " - " . max($ids) . "<br>";
    }

    curl_close($ch_firebase);
    curl_multi_close($multi_handle);
}
?>
