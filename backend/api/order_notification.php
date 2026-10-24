<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$name     = htmlspecialchars(trim($data['name'] ?? 'Not provided'));
$email    = htmlspecialchars(trim($data['email'] ?? 'Not provided'));
$plan     = htmlspecialchars(trim($data['plan'] ?? 'Not provided'));
$screens  = htmlspecialchars(trim($data['screens'] ?? '1 Screen'));
$price    = htmlspecialchars(trim($data['price'] ?? 'N/A'));
$action   = htmlspecialchars(trim($data['action'] ?? 'Checkout'));
$pageUrl  = htmlspecialchars(trim($data['pageUrl'] ?? 'https://accessiqtech.net/subscription'));
$date     = date('Y-m-d H:i:s T');

$botToken = '8819844031:AAHgOAd7SJpG83_TNgcl5wofMaXyZ68QoTo';
$chatId   = '-5388671844';

$message = "🚨 <b>NEW IPTV ORDER NOTIFICATION</b> 🚨\n\n";
$message .= "👤 <b>Customer Name:</b> " . $name . "\n";
$message .= "📧 <b>Customer Email:</b> " . $email . "\n";
$message .= "📺 <b>Plan:</b> " . $plan . "\n";
$message .= "🖥️ <b>Screens:</b> " . $screens . "\n";
$message .= "💰 <b>Price:</b> " . $price . "\n";
$message .= "⚡ <b>Chosen Action:</b> " . $action . "\n";
$message .= "🌐 <b>Page Link:</b> " . $pageUrl . "\n";
$message .= "📅 <b>Date:</b> " . $date . "\n";

$telegramApiUrl = "https://api.telegram.org/bot" . $botToken . "/sendMessage";

$postFields = [
    'chat_id'    => $chatId,
    'text'       => $message,
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => false
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $telegramApiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    echo json_encode([
        'success' => false,
        'error'   => 'Failed to forward to Telegram: ' . $curlErr,
        'http_code' => $httpCode
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Notification dispatched successfully'
]);
