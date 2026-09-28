<?php
// backend/helpers/validator.php

function sanitizeString($str) {
    if ($str === null) return '';
    return trim(htmlspecialchars(strip_tags($str), ENT_QUOTES, 'UTF-8'));
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function isValidUsername($username) {
    return preg_match('/^[a-zA-Z0-9_-]{3,30}$/', $username);
}
