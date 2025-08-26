<?php

// https://www.slimframework.com/ <-- niet begrijpbaar dan ga naar deze methode!

header('CONTENT-TYPE: application/json');


$uri = strtok($_SERVER['REQUEST_URI'], '?');;
switch ($uri) {


    case '/add-pokemon':
        require_once __DIR__ . '/../main.php';
        break;
    
    default:  
        echo "Invalid endpoint.";
        break;
}