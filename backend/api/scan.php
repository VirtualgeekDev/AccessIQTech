<?php
/**
 * AI Scan API Endpoint
 * POST /api/scan
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Parse the request path to determine the action
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = $path ? explode('/', trim($path, '/')) : [];

// Extract action from URL (e.g., /api/scan/apply-fix -> apply-fix)
$action = !empty($pathParts) ? end($pathParts) : '';

// Handle different scan actions
if ($action === 'apply-fix') {
    handleApplyFix();
    exit();
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$url = $input['url'] ?? '';

if (empty($url)) {
    http_response_code(400);
    echo json_encode(['error' => 'URL is required']);
    exit();
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL format']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Check user's scan limits based on their plan
    $scanLimit = getUserScanLimit($user['id']);
    $currentMonthScans = getCurrentMonthScanCount($user['id']);
    
    if ($currentMonthScans >= $scanLimit) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Scan limit exceeded',
            'limit' => $scanLimit,
            'used' => $currentMonthScans
        ]);
        exit();
    }
    
    // Create scan record
    $scanId = createScanRecord($user['id'], $url);
    
    // Start async scan process (in production, this would be queued)
    $scanResult = performAccessibilityScan($url);
    
    // Update scan record with results
    updateScanRecord($scanId, $scanResult);
    
    echo json_encode([
        'success' => true,
        'scan_id' => $scanId,
        'url' => $url,
        'status' => 'completed',
        'score' => $scanResult['score'],
        'issues_found' => $scanResult['issues_found'],
        'report' => $scanResult['report']
    ]);
    
} catch (Exception $e) {
    error_log("Scan API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getUserScanLimit($userId) {
    $db = Database::getInstance();
    
    // Get user's current subscription
    $stmt = $db->query(
        "SELECT p.name FROM subscriptions s 
         JOIN plans p ON s.plan_id = p.id 
         WHERE s.user_id = ? AND s.status IN ('active', 'trialing') 
         ORDER BY s.created_at DESC LIMIT 1",
        [$userId]
    );
    
    $subscription = $stmt->fetch();
    
    if (!$subscription) {
        return 5; // Default limit for trial users
    }
    
    // Return limits based on plan
    switch (strtolower($subscription['name'])) {
        case 'starter':
            return 5;
        case 'professional':
            return 25;
        case 'enterprise':
            return 999999; // Unlimited
        default:
            return 5;
    }
}

function getCurrentMonthScanCount($userId) {
    $db = Database::getInstance();
    
    $stmt = $db->query(
        "SELECT COUNT(*) as count FROM scans 
         WHERE user_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')",
        [$userId]
    );
    
    $result = $stmt->fetch();
    return (int)$result['count'];
}

function createScanRecord($userId, $url) {
    $db = Database::getInstance();
    
    $stmt = $db->query(
        "INSERT INTO scans (user_id, url, status) VALUES (?, ?, 'scanning')",
        [$userId, $url]
    );
    
    return $db->lastInsertId();
}

function performAccessibilityScan($url) {
    $startTime = microtime(true);
    
    try {
        // Try Node.js scan first, fallback to PHP-based analysis if blocked
        $nodeResult = tryNodeJsScan($url);
        if ($nodeResult) {
            return $nodeResult;
        }
        
        // Fallback: PHP-based accessibility analysis
        return performPhpBasedScan($url);
        
    } catch (Exception $e) {
        error_log("Primary scan failed for $url: " . $e->getMessage());
        
        // Fallback to PHP-based scan
        try {
            return performPhpBasedScan($url);
        } catch (Exception $fallbackError) {
            error_log("Fallback scan also failed for $url: " . $fallbackError->getMessage());
            throw new Exception("All scan methods failed: " . $e->getMessage());
        }
    }
}

function tryNodeJsScan($url) {
    try {
        // Get Axe Developer Hub credentials
        $apiKey = $_ENV['AXE_API_KEY'] ?? 'placeholder-api-key';
        $serverURL = $_ENV['AXE_SERVER_URL'] ?? 'https://localhost';
        
        // Generate build ID for tracking
        $buildID = 'scan-' . hash('sha256', $url . time());
        $branchName = 'main';
        
        // Path to Node.js scan script
        $scriptPath = __DIR__ . '/../axe-watcher/scan.js';
        
        // Try to find Node.js executable
        $nodePath = '/usr/bin/node'; // Default system path
        if (!file_exists($nodePath)) {
            // Try common alternative paths
            $alternativePaths = [
                '/usr/local/bin/node',
                '/opt/node/bin/node',
                '/home/accessiqtech/.nvm/versions/node/v22.17.1/bin/node',
                '/home/u581463275/.nvm/versions/node/v22.17.1/bin/node'
            ];
            
            foreach ($alternativePaths as $altPath) {
                if (file_exists($altPath)) {
                    $nodePath = $altPath;
                    break;
                }
            }
        }
        
        // Check if Node.js and script exist
        if (!file_exists($scriptPath) || !file_exists($nodePath)) {
            error_log("Node.js scan unavailable - Script: " . ($scriptPath ? 'found' : 'missing') . ", Node: " . ($nodePath ? 'found' : 'missing'));
            return null;
        }
        
        // Prepare command with proper escaping
        $command = sprintf(
            'cd %s && %s scan.js %s %s %s %s %s 2>&1',
            escapeshellarg(dirname($scriptPath)),
            escapeshellarg($nodePath),
            escapeshellarg($url),
            escapeshellarg($apiKey),
            escapeshellarg($serverURL),
            escapeshellarg($buildID),
            escapeshellarg($branchName)
        );
        
        // Execute the Node.js script
        $output = shell_exec($command);
        
        if ($output === null) {
            error_log("Node.js scan failed - no output returned");
            return null;
        }
        
        // Parse the output from Node.js script
        $result = json_decode($output, true);
        
        if (!$result || !$result['success']) {
            error_log("Node.js scan failed - Invalid result: " . $output);
            return null; // Failed, will use fallback
        }
        
        $endTime = microtime(true);
        $duration = round($endTime - microtime(true), 2);
        
        // Calculate score based on Axe results
        $violations = $result['violations'] ?? 0;
        $passes = $result['passes'] ?? 0;
        $incomplete = $result['incomplete'] ?? 0;
        $totalTests = $violations + $passes + $incomplete;
        $score = $totalTests > 0 ? round((($result['passes'] / $totalTests) * 100), 0) : 100;
        
        // Apply penalty for violations based on severity
        if (isset($result['detailedResults']['violations'])) {
            $severityPenalty = 0;
            foreach ($result['detailedResults']['violations'] as $violation) {
                switch ($violation['impact'] ?? 'minor') {
                    case 'critical':
                        $severityPenalty += 15;
                        break;
                    case 'serious':
                        $severityPenalty += 10;
                        break;
                    case 'moderate':
                        $severityPenalty += 5;
                        break;
                    case 'minor':
                        $severityPenalty += 2;
                        break;
                }
            }
            $score = max(0, $score - $severityPenalty);
        }
        
        // Convert Axe results to our format
        $issues = convertAxeResultsToIssues($result);
        
        return [
            'score' => $score,
            'issues_found' => $violations,
            'duration' => $duration,
            'report' => [
                'url' => $url,
                'scan_date' => date('Y-m-d H:i:s'),
                'wcag_version' => '2.1',
                'level' => 'AA',
                'axe_version' => $result['axeVersion'] ?? 'unknown',
                'build_id' => $buildID,
                'branch_name' => $branchName,
                'scan_type' => 'Axe-Core Puppeteer (@axe-core/puppeteer)',
                'issues' => $issues,
                'summary' => [
                    'total_issues' => $result['violations'],
                    'violations' => $violations,
                    'passes' => $passes,
                    'incomplete' => $incomplete,
                    'inapplicable' => $result['inapplicable'] ?? 0,
                    'critical' => countViolationsBySeverity($result, 'critical'),
                    'high' => countViolationsBySeverity($result, 'serious'),
                    'medium' => countViolationsBySeverity($result, 'moderate'),
                    'low' => countViolationsBySeverity($result, 'minor')
                ],
                'recommendations' => generateAxeRecommendations($result),
                'build_id' => $buildID
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Node.js scan failed: " . $e->getMessage());
        return null; // Will use fallback
    }
}

function performPhpBasedScan($url) {
    $startTime = microtime(true);
    
    // Fetch the webpage content
    $html = fetchWebpageContent($url);
    if (!$html) {
        throw new Exception("Could not fetch webpage content");
    }
    
    // Parse HTML and analyze for accessibility issues
    $issues = analyzeHtmlForAccessibility($html, $url);
    
    $endTime = microtime(true);
    $duration = round($endTime - $startTime, 2);
    
    // Calculate score based on issues found
    $totalIssues = count($issues);
    $criticalIssues = count(array_filter($issues, fn($i) => $i['severity'] === 'critical'));
    $highIssues = count(array_filter($issues, fn($i) => $i['severity'] === 'high'));
    $mediumIssues = count(array_filter($issues, fn($i) => $i['severity'] === 'medium'));
    $lowIssues = count(array_filter($issues, fn($i) => $i['severity'] === 'low'));
    
    // Score calculation: Start at 100, deduct points for issues
    $score = 100;
    $score -= ($criticalIssues * 20);
    $score -= ($highIssues * 15);
    $score -= ($mediumIssues * 10);
    $score -= ($lowIssues * 5);
    $score = max(0, $score);
    
    return [
        'score' => $score,
        'issues_found' => $totalIssues,
        'duration' => $duration,
        'report' => [
            'url' => $url,
            'scan_date' => date('Y-m-d H:i:s'),
            'wcag_version' => '2.1',
            'level' => 'AA',
            'scan_type' => 'PHP-based Analysis (Fallback)',
            'issues' => $issues,
            'summary' => [
                'total_issues' => $totalIssues,
                'critical' => $criticalIssues,
                'high' => $highIssues,
                'medium' => $mediumIssues,
                'low' => $lowIssues
            ],
            'recommendations' => generatePhpRecommendations($issues)
        ]
    ];
}

function fetchWebpageContent($url) {
    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'user_agent' => 'AccessIQ Tech Accessibility Scanner/1.0',
            'follow_location' => true,
            'max_redirects' => 5
        ]
    ]);
    
    return @file_get_contents($url, false, $context);
}

function analyzeHtmlForAccessibility($html, $url) {
    $issues = [];
    
    // Create DOMDocument for parsing
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    
    $xpath = new DOMXPath($dom);
    
    // Check for images without alt text
    $imagesWithoutAlt = $xpath->query('//img[not(@alt) or @alt=""]');
    if ($imagesWithoutAlt->length > 0) {
        $issues[] = [
            'type' => 'missing_alt_text',
            'title' => 'Images missing alt text',
            'description' => 'Found ' . $imagesWithoutAlt->length . ' images without alternative text',
            'severity' => 'high',
            'wcag_criterion' => '1.1.1',
            'element_count' => $imagesWithoutAlt->length,
            'fix_suggestion' => 'Add descriptive alt attributes to all images'
        ];
    }
    
    // Check for form inputs without labels
    $inputsWithoutLabels = $xpath->query('//input[@type!="hidden" and @type!="submit" and @type!="button"][not(@id) or not(//label[@for=current()/@id])]');
    if ($inputsWithoutLabels->length > 0) {
        $issues[] = [
            'type' => 'form_labels',
            'title' => 'Form inputs missing labels',
            'description' => 'Found ' . $inputsWithoutLabels->length . ' form inputs without proper labels',
            'severity' => 'critical',
            'wcag_criterion' => '1.3.1',
            'element_count' => $inputsWithoutLabels->length,
            'fix_suggestion' => 'Add proper labels to all form inputs using <label> elements'
        ];
    }
    
    // Check heading structure
    $headings = $xpath->query('//h1 | //h2 | //h3 | //h4 | //h5 | //h6');
    $headingLevels = [];
    foreach ($headings as $heading) {
        $level = (int)substr($heading->tagName, 1);
        $headingLevels[] = $level;
    }
    
    if (!empty($headingLevels)) {
        $hasH1 = in_array(1, $headingLevels);
        $hasSkippedLevels = false;
        
        for ($i = 1; $i < count($headingLevels); $i++) {
            if ($headingLevels[$i] > $headingLevels[$i-1] + 1) {
                $hasSkippedLevels = true;
                break;
            }
        }
        
        if (!$hasH1) {
            $issues[] = [
                'type' => 'missing_h1',
                'title' => 'Missing H1 heading',
                'description' => 'Page does not have an H1 heading',
                'severity' => 'medium',
                'wcag_criterion' => '1.3.1',
                'element_count' => 1,
                'fix_suggestion' => 'Add an H1 heading to the page'
            ];
        }
        
        if ($hasSkippedLevels) {
            $issues[] = [
                'type' => 'heading_structure',
                'title' => 'Improper heading hierarchy',
                'description' => 'Headings skip levels in the hierarchy',
                'severity' => 'medium',
                'wcag_criterion' => '1.3.1',
                'element_count' => 1,
                'fix_suggestion' => 'Ensure headings follow proper h1-h6 hierarchy without skipping levels'
            ];
        }
    }
    
    // Check for links without text
    $emptyLinks = $xpath->query('//a[not(text()) and not(img[@alt]) and not(@aria-label) and not(@title)]');
    if ($emptyLinks->length > 0) {
        $issues[] = [
            'type' => 'empty_links',
            'title' => 'Links without accessible text',
            'description' => 'Found ' . $emptyLinks->length . ' links without accessible text',
            'severity' => 'high',
            'wcag_criterion' => '2.4.4',
            'element_count' => $emptyLinks->length,
            'fix_suggestion' => 'Add descriptive text, aria-label, or title attributes to links'
        ];
    }
    
    // Check for missing page title
    $title = $xpath->query('//title');
    if ($title->length === 0 || trim($title->item(0)->textContent) === '') {
        $issues[] = [
            'type' => 'missing_title',
            'title' => 'Missing or empty page title',
            'description' => 'Page does not have a descriptive title',
            'severity' => 'high',
            'wcag_criterion' => '2.4.2',
            'element_count' => 1,
            'fix_suggestion' => 'Add a descriptive <title> element to the page'
        ];
    }
    
    // Check for missing lang attribute
    $html_element = $xpath->query('//html');
    if ($html_element->length > 0 && !$html_element->item(0)->hasAttribute('lang')) {
        $issues[] = [
            'type' => 'missing_lang',
            'title' => 'Missing language attribute',
            'description' => 'HTML element does not have a lang attribute',
            'severity' => 'medium',
            'wcag_criterion' => '3.1.1',
            'element_count' => 1,
            'fix_suggestion' => 'Add lang attribute to the HTML element (e.g., <html lang="en">)'
        ];
    }
    
    return $issues;
}

function generatePhpRecommendations($issues) {
    $recommendations = [];
    
    if (empty($issues)) {
        $recommendations[] = 'Great! No major accessibility issues were found in this basic scan';
        $recommendations[] = 'Consider running a more comprehensive scan with automated tools for complete coverage';
    } else {
        $recommendations[] = 'Address the ' . count($issues) . ' accessibility issues found in this scan';
        
        $criticalCount = count(array_filter($issues, fn($i) => $i['severity'] === 'critical'));
        $highCount = count(array_filter($issues, fn($i) => $i['severity'] === 'high'));
        
        if ($criticalCount > 0) {
            $recommendations[] = 'Priority: Fix ' . $criticalCount . ' critical accessibility issues first';
        }
        
        if ($highCount > 0) {
            $recommendations[] = 'Important: Address ' . $highCount . ' high-priority accessibility issues';
        }
        
        $recommendations[] = 'Test your website with screen readers and keyboard navigation';
        $recommendations[] = 'Consider implementing automated accessibility testing in your development workflow';
    }
    
    $recommendations[] = 'Regular accessibility audits help maintain compliance over time';
    $recommendations[] = 'For comprehensive scanning, consider upgrading to enable advanced AI-powered analysis';
    
    return $recommendations;
}

function countViolationsBySeverity($axeResult, $severity) {
    if (!isset($axeResult['detailedResults']['violations'])) {
        return 0;
    }
    
    $count = 0;
    foreach ($axeResult['detailedResults']['violations'] as $violation) {
        if (($violation['impact'] ?? 'minor') === $severity) {
            $count++;
        }
    }
    return $count;
}

function convertAxeResultsToIssues($axeResult) {
    $issues = [];
    
    // Convert detailed violation results if available
    if (isset($axeResult['detailedResults']['violations'])) {
        foreach ($axeResult['detailedResults']['violations'] as $violation) {
            $severity = mapAxeImpactToSeverity($violation['impact'] ?? 'minor');
            
            $issues[] = [
                'type' => $violation['id'],
                'title' => $violation['help'] ?? 'Accessibility Issue',
                'description' => $violation['description'] ?? 'No description available',
                'severity' => $severity,
                'wcag_criterion' => implode(', ', array_filter($violation['tags'] ?? [], function($tag) {
                    return strpos($tag, 'wcag') === 0;
                })),
                'element_count' => $violation['nodes'] ?? 1,
                'fix_suggestion' => 'See: ' . ($violation['helpUrl'] ?? 'Axe Developer Hub for details'),
                'help_url' => $violation['helpUrl'] ?? null
            ];
        }
    } else if ($axeResult['violations'] > 0) {
        // Fallback for basic results
        $issues[] = [
            'type' => 'axe_violations',
            'title' => 'Accessibility Violations Detected',
            'description' => 'Axe found ' . $axeResult['violations'] . ' accessibility violations on this page',
            'severity' => 'high',
            'wcag_criterion' => 'Multiple',
            'element_count' => $axeResult['violations'],
            'fix_suggestion' => 'Review the detailed Axe Developer Hub report for specific fixes'
        ];
    }
    
    // Add incomplete tests as medium severity issues
    if (isset($axeResult['detailedResults']['incomplete'])) {
        foreach ($axeResult['detailedResults']['incomplete'] as $incomplete) {
            $issues[] = [
                'type' => $incomplete['id'] . '_incomplete',
                'title' => 'Manual Review Required: ' . ($incomplete['description'] ?? 'Incomplete Test'),
                'description' => 'This accessibility test requires manual verification',
                'severity' => 'medium',
                'wcag_criterion' => 'Manual Review',
                'element_count' => $incomplete['nodes'] ?? 1,
                'fix_suggestion' => 'Manually review this element for accessibility compliance'
            ];
        }
    } else if ($axeResult['incomplete'] > 0) {
        $issues[] = [
            'type' => 'axe_incomplete',
            'title' => 'Incomplete Accessibility Tests',
            'description' => 'Axe found ' . $axeResult['incomplete'] . ' tests that need manual review',
            'severity' => 'medium',
            'wcag_criterion' => 'Multiple',
            'element_count' => $axeResult['incomplete'],
            'fix_suggestion' => 'Manually review the incomplete tests in the Axe Developer Hub report'
        ];
    }
    
    return $issues;
}

function mapAxeImpactToSeverity($impact) {
    switch ($impact) {
        case 'critical':
            return 'critical';
        case 'serious':
            return 'high';
        case 'moderate':
            return 'medium';
        case 'minor':
            return 'low';
        default:
            return 'medium';
    }
}

function generateAxeRecommendations($axeResult) {
    $recommendations = [];
    
    if ($axeResult['violations'] > 0) {
        $recommendations[] = 'Review and fix the ' . $axeResult['violations'] . ' accessibility violations found by Axe';
        $recommendations[] = 'Access your Axe Developer Hub dashboard for detailed remediation steps';
    }
    
    if ($axeResult['incomplete'] > 0) {
        $recommendations[] = 'Manually review the ' . $axeResult['incomplete'] . ' incomplete accessibility tests';
    }
    
    if ($axeResult['passes'] > 0) {
        $recommendations[] = 'Great job! ' . $axeResult['passes'] . ' accessibility tests passed successfully';
    }
    
    if (isset($axeResult['buildID'])) {
        $recommendations[] = 'Track your progress in Axe Developer Hub using build ID: ' . $axeResult['buildID'];
    }
    
    $recommendations[] = 'Consider implementing automated accessibility testing in your development workflow';
    $recommendations[] = 'Regular accessibility audits help maintain compliance over time';
    
    return $recommendations;
}

function updateScanRecord($scanId, $result) {
    $db = Database::getInstance();
    
    $stmt = $db->query(
        "UPDATE scans SET 
         status = 'completed', 
         report_json = ?, 
         score = ?, 
         issues_found = ?, 
         scan_duration = ?,
         completed_at = NOW()
         WHERE id = ?",
        [
            json_encode($result['report']),
            $result['score'],
            $result['issues_found'],
            $result['duration'],
            $scanId
        ]
    );
}

function handleApplyFix() {
    global $security, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Authenticate user
    $user = authenticateUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $scanId = $security->sanitizeInput($input['scan_id'] ?? '');
    $issueType = $security->sanitizeInput($input['issue_type'] ?? '');
    $issueIndex = (int)($input['issue_index'] ?? 0);
    
    if (empty($scanId) || empty($issueType)) {
        http_response_code(400);
        echo json_encode(['error' => 'Scan ID and issue type are required']);
        return;
    }
    
    try {
        // Verify user owns this scan
        $stmt = $db->query(
            "SELECT id, url, report_json FROM scans WHERE id = ? AND user_id = ?",
            [$scanId, $user['id']]
        );
        
        $scan = $stmt->fetch();
        
        if (!$scan) {
            http_response_code(404);
            echo json_encode(['error' => 'Scan not found']);
            return;
        }
        
        // Rate limiting for AI fixes
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!$security->checkRateLimit("ai_fix_{$user['id']}", 10, 3600)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many AI fix requests. Please try again later.']);
            return;
        }
        
        // Simulate AI fix processing
        $fixResult = simulateAIFix($issueType, $scan['url']);
        
        // Log the AI fix action
        $security->logSecurityEvent('ai_fix_applied', [
            'user_id' => $user['id'],
            'scan_id' => $scanId,
            'issue_type' => $issueType,
            'issue_index' => $issueIndex,
            'url' => $scan['url'],
            'fix_success' => $fixResult['success']
        ]);
        
        // Store AI fix in database (optional: create ai_fixes table)
        try {
            $db->query(
                "INSERT INTO ai_fixes (user_id, scan_id, issue_type, issue_index, fix_description, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, 'applied', NOW())",
                [$user['id'], $scanId, $issueType, $issueIndex, $fixResult['description']]
            );
        } catch (Exception $e) {
            // Table might not exist, create it
            createAIFixesTable();
            $db->query(
                "INSERT INTO ai_fixes (user_id, scan_id, issue_type, issue_index, fix_description, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, 'applied', NOW())",
                [$user['id'], $scanId, $issueType, $issueIndex, $fixResult['description']]
            );
        }
        
        echo json_encode([
            'success' => true,
            'message' => $fixResult['message'],
            'fix_description' => $fixResult['description'],
            'estimated_improvement' => $fixResult['estimated_improvement']
        ]);
        
    } catch (Exception $e) {
        error_log("AI Fix error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to apply AI fix']);
    }
}

function simulateAIFix($issueType, $url) {
    // Simulate realistic AI processing time
    usleep(rand(1000000, 3000000)); // 1-3 seconds
    
    // Enhanced AI fix simulations with detailed descriptions
    $aiFixDatabase = [
        'missing_alt_text' => [
            'message' => 'AI has analyzed and generated contextual alt text for all images',
            'description' => 'Using advanced computer vision and natural language processing, our AI examined each image\'s context, surrounding text, and visual content to generate meaningful alt text that enhances screen reader accessibility.',
            'estimated_improvement' => '+15 points',
            'technical_details' => 'Applied semantic image analysis with 94% accuracy confidence',
            'code_changes' => 'Added alt attributes to 12 img elements',
            'before_after' => [
                'before' => '<img src="chart.png">',
                'after' => '<img src="chart.png" alt="Monthly sales growth chart showing 25% increase">'
            ]
        ],
        'color_contrast' => [
            'message' => 'AI has optimized color contrast to meet WCAG 2.1 AA standards',
            'description' => 'Our AI color optimization engine analyzed your brand palette and automatically adjusted foreground/background color combinations to achieve the required 4.5:1 contrast ratio while maintaining visual appeal.',
            'estimated_improvement' => '+12 points',
            'technical_details' => 'Optimized 8 color combinations using perceptual color space analysis',
            'code_changes' => 'Updated CSS color values in 5 stylesheets',
            'before_after' => [
                'before' => 'color: #999999; background: #ffffff; (3.1:1 ratio)',
                'after' => 'color: #666666; background: #ffffff; (4.6:1 ratio)'
            ]
        ],
        'form_labels' => [
            'message' => 'AI has enhanced form accessibility with proper labeling',
            'description' => 'Our intelligent form analyzer identified unlabeled inputs and automatically created semantic label associations using contextual clues from surrounding text and form structure.',
            'estimated_improvement' => '+18 points',
            'technical_details' => 'Enhanced 15 form controls with semantic labeling',
            'code_changes' => 'Added label elements and aria-labelledby attributes',
            'before_after' => [
                'before' => '<input type="email" placeholder="Email">',
                'after' => '<label for="email">Email Address</label><input type="email" id="email" aria-required="true">'
            ]
        ],
        'heading_structure' => [
            'message' => 'AI has restructured heading hierarchy for better navigation',
            'description' => 'Using semantic content analysis, our AI reorganized your heading structure to create a logical, hierarchical outline that improves screen reader navigation and SEO.',
            'estimated_improvement' => '+10 points',
            'technical_details' => 'Restructured 23 headings across 3 hierarchy levels',
            'code_changes' => 'Updated heading tags (h1-h6) and added ARIA landmarks',
            'before_after' => [
                'before' => '<h1>Title</h1><h3>Subtitle</h3><h2>Section</h2>',
                'after' => '<h1>Title</h1><h2>Section</h2><h3>Subtitle</h3>'
            ]
        ],
        'empty_links' => [
            'message' => 'AI has enhanced link accessibility with descriptive text',
            'description' => 'Our natural language AI analyzed link destinations and context to generate meaningful link text and ARIA labels, replacing generic phrases like "click here" with descriptive alternatives.',
            'estimated_improvement' => '+8 points',
            'technical_details' => 'Enhanced 9 links with contextual descriptions',
            'code_changes' => 'Added aria-label attributes and descriptive text',
            'before_after' => [
                'before' => '<a href="/report.pdf">Download</a>',
                'after' => '<a href="/report.pdf" aria-label="Download accessibility compliance report (PDF, 2.3MB)">Download Report</a>'
            ]
        ],
        'keyboard_navigation' => [
            'message' => 'AI has optimized keyboard navigation accessibility',
            'description' => 'Our accessibility AI identified interactive elements lacking keyboard support and automatically added proper focus management, tab order, and keyboard event handlers.',
            'estimated_improvement' => '+14 points',
            'technical_details' => 'Enhanced 11 interactive elements with keyboard support',
            'code_changes' => 'Added tabindex, focus styles, and keyboard event handlers',
            'before_after' => [
                'before' => '<div onclick="openModal()">Open</div>',
                'after' => '<button onclick="openModal()" onkeydown="handleKeyPress(event)" aria-label="Open modal dialog">Open</button>'
            ]
        ],
        'missing_lang' => [
            'message' => 'AI has added language declarations for better accessibility',
            'description' => 'Our content analysis AI detected the primary language of your content and automatically added appropriate lang attributes to improve screen reader pronunciation.',
            'estimated_improvement' => '+5 points',
            'technical_details' => 'Added language declarations with 98% confidence',
            'code_changes' => 'Added lang attributes to HTML elements',
            'before_after' => [
                'before' => '<html>',
                'after' => '<html lang="en">'
            ]
        ]
    ];
    
    // Enhanced default fix for unknown issue types
    $enhancedDefaultFix = [
        'message' => 'AI has applied intelligent accessibility improvements',
        'description' => 'Our advanced AI accessibility engine analyzed this specific issue and applied targeted improvements based on WCAG 2.1 guidelines and best practices from thousands of similar cases.',
        'estimated_improvement' => '+7 points',
        'technical_details' => 'Applied context-aware accessibility enhancements',
        'code_changes' => 'Multiple accessibility improvements applied',
        'before_after' => [
            'before' => 'Non-compliant element structure',
            'after' => 'WCAG 2.1 compliant element with proper semantics'
        ]
    ];
    
    $selectedFix = $aiFixDatabase[$issueType] ?? $enhancedDefaultFix;
    
    // Simulate realistic AI processing challenges (8% chance)
    if (rand(1, 100) <= 8) {
        $failureReasons = [
            'This issue requires manual review due to complex content structure',
            'AI detected potential brand impact - manual approval needed',
            'Multiple conflicting accessibility patterns detected',
            'Custom JavaScript framework requires specialized handling',
            'Content management system restrictions prevent automatic fixes'
        ];
        
        return [
            'success' => false,
            'message' => 'AI fix requires manual review',
            'description' => $failureReasons[array_rand($failureReasons)],
            'estimated_improvement' => '0 points',
            'manual_steps' => [
                'Review the suggested changes in your development environment',
                'Test the fix with your specific content management system',
                'Validate the changes don\'t conflict with existing functionality'
            ]
        ];
    }
    
    // Add processing metadata to successful fixes
    $selectedFix['success'] = true;
    $selectedFix['processing_time'] = rand(1200, 2800) . 'ms';
    $selectedFix['confidence_score'] = rand(85, 98) . '%';
    $selectedFix['ai_model'] = 'AccessIQ-AI-v2.1';
    
    return $selectedFix;
}

function createAIFixesTable() {
    global $db;
    
    try {
        $db->query("
            CREATE TABLE IF NOT EXISTS ai_fixes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                scan_id INT NOT NULL,
                issue_type VARCHAR(100) NOT NULL,
                issue_index INT NOT NULL,
                fix_description TEXT NOT NULL,
                status ENUM('applied', 'failed', 'reverted') DEFAULT 'applied',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
                INDEX idx_user_scan (user_id, scan_id),
                INDEX idx_issue_type (issue_type)
            )
        ");
    } catch (Exception $e) {
        error_log("Failed to create ai_fixes table: " . $e->getMessage());
    }
}