<?php
$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon.json';
$batch_size = 10; // till gen 3

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
            $abilities_structured = [];
            foreach ($pokeapi_data['abilities'] as $ability) {
                $name = $ability['ability']['name'];
                $abilities_structured[$name] = [
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

            $filtered_data = [
                'id' => $pokeapi_data['id'],
                'name' => $pokeapi_data['name'],
                'types' => array_map(fn($t) => $t['type']['name'], $pokeapi_data['types']),
                'abilities' => array_map(fn($a) => $a['ability']['name'], $pokeapi_data['abilities']),
                'height' => $pokeapi_data['height'],
                'weight' => $pokeapi_data['weight']
            ];

            $poke_id = $filtered_data['id'];
            $ch_firebase = curl_init();
            curl_setopt($ch_firebase, CURLOPT_URL, $firebase_url . '/' . $poke_id . '.json');
            curl_setopt($ch_firebase, CURLOPT_CUSTOMREQUEST, "PUT");
            curl_setopt($ch_firebase, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch_firebase, CURLOPT_POSTFIELDS, json_encode($filtered_data));
            curl_setopt($ch_firebase, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            $response = curl_exec($ch_firebase);
            curl_close($ch_firebase);

            echo "Added: " . $filtered_data['name'] . "<br>";
        }

        curl_multi_remove_handle($multi_handle, $ch);
        curl_close($ch);
    }

    curl_multi_close($multi_handle);
}
