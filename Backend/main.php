<?php
$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon.json';
$batch_size = 300;

for ($start = 1; $start <= 100; $start += $batch_size) {
    $multi_handle = curl_multi_init();
    $curl_handles = [];

    for ($i = 0; $i < $batch_size && ($start + $i) <= 100; $i++) {
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

    foreach ($curl_handles as $id => $ch) {
        $pokeapi_response = curl_multi_getcontent($ch);
        $pokeapi_data = json_decode($pokeapi_response, true);

        if ($pokeapi_data) {
            $types = array_map(function($type) {
                return $type['type']['name'];
            }, $pokeapi_data['types']);

            $damage_relations = [];
            foreach ($types as $type_name) {
                $type_url = "https://pokeapi.co/api/v2/type/$type_name";
                $type_response = file_get_contents($type_url);
                $type_data = json_decode($type_response, true);
                if ($type_data && isset($type_data['damage_relations'])) {
                    $damage_relations[$type_name] = $type_data['damage_relations'];
                }
            }

            $new_pokemon = [
                'name' => $pokeapi_data['name'],
                'types' => $types,
                'weight' => $pokeapi_data['weight'],
                'height' => $pokeapi_data['height'],
                'base_experience' => $pokeapi_data['base_experience'],
                'abilities' => $pokeapi_data['abilities'],
                'image' => $pokeapi_data['sprites']['front_default'],
                'moveset' => $pokeapi_data['moves'],
                'damage_relations' => $damage_relations 
            ];

            $ch_firebase = curl_init();
            curl_setopt($ch_firebase, CURLOPT_URL, $firebase_url);
            curl_setopt($ch_firebase, CURLOPT_POST, true);
            curl_setopt($ch_firebase, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch_firebase, CURLOPT_POSTFIELDS, json_encode($new_pokemon));
            curl_setopt($ch_firebase, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_exec($ch_firebase);
            curl_close($ch_firebase);

            echo "Added: " . $new_pokemon['name'] . "<br>";
        }

        curl_multi_remove_handle($multi_handle, $ch);
        curl_close($ch);
    }

    curl_multi_close($multi_handle);
}
?>