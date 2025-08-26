<?php




$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon.json';

$new_pokemon = [
    'name' => 'Pikachu',
    'type' => 'Electric'
];


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $firebase_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($new_pokemon));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);


$response = curl_exec($ch);
curl_close($ch);

echo $response;

?>