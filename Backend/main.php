<?php




$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon.json';

$incoming_json = file_get_contents('php://input');
$pokemon_data = json_decode($incoming_json, true);

if (!$pokemon_data) {
    echo json_encode(['error' => 'No data received']);
    exit;
}

$filtered_data = [
    'id' => $pokemon_data['id'],
    'name' => $pokemon_data['name'],
    'types' => array_map(function($t){ return $t['type']['name']; }, $pokemon_data['types']),
    'abilities' => array_map(function($a){ return $a['ability']['name']; }, $pokemon_data['abilities']),
    'height' => $pokemon_data['height'],
    'weight' => $pokemon_data['weight']
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $firebase_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($filtered_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

echo $response;

?>