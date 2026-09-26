<?php

$commands = [
    "ffmpeg -version",
    "/usr/bin/ffmpeg -version",
    "/usr/local/bin/ffmpeg -version",
    "which ffmpeg",
    "whereis ffmpeg"
];

foreach ($commands as $cmd) {
    echo "<h3>$cmd</h3>";

    exec($cmd . " 2>&1", $out, $code);

    echo "Exit Code: $code<br>";
    echo "<pre>";
    print_r($out);
    echo "</pre><hr>";
}