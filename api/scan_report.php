<?php
/**
 * Scan Report API Endpoint
 * GET /api/scan_report.php?id={scan_id}
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Authenticate user
$user = authenticateUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$scanId = $_GET['id'] ?? '';

if (empty($scanId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Scan ID is required']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Get scan report - ensure user owns this scan
    $stmt = $db->query(
        "SELECT id, url, status, report_json, score, issues_found, scan_duration, created_at, completed_at 
         FROM scans 
         WHERE id = ? AND user_id = ?",
        [$scanId, $user['id']]
    );
    
    $scan = $stmt->fetch();
    
    if (!$scan) {
        http_response_code(404);
        echo json_encode(['error' => 'Scan report not found']);
        exit();
    }
    
    // Parse the report JSON
    $reportData = json_decode($scan['report_json'], true);
    
    if (!$reportData) {
        http_response_code(500);
        echo json_encode(['error' => 'Invalid report data']);
        exit();
    }
    
    // Format the response
    $response = [
        'success' => true,
        'report' => [
            'id' => $scan['id'],
            'url' => $scan['url'],
            'score' => (int)$scan['score'],
            'status' => $scan['status'],
            'issues_found' => (int)$scan['issues_found'],
            'scan_date' => $scan['completed_at'] ?: $scan['created_at'],
            'scan_duration' => (int)$scan['scan_duration'],
            'wcag_version' => $reportData['wcag_version'] ?? '2.1',
            'level' => $reportData['level'] ?? 'AA',
            'scan_type' => $reportData['scan_type'] ?? 'Accessibility Analysis',
            'issues' => $reportData['issues'] ?? [],
            'summary' => $reportData['summary'] ?? [
                'total_issues' => (int)$scan['issues_found'],
                'critical' => 0,
                'high' => 0,
                'medium' => 0,
                'low' => 0
            ],
            'recommendations' => $reportData['recommendations'] ?? []
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Scan report API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}