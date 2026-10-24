<?php
/**
 * Blog Posts API Endpoints
 * Handles CRUD operations for blog articles
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../config/security.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$security = SecurityManager::getInstance();
$db = Database::getInstance();

// Parse the request path to determine the action
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract post ID if present (e.g., /api/blog_posts/123 -> 123)
$postId = null;
if (count($pathParts) > 2 && is_numeric(end($pathParts))) {
    $postId = end($pathParts);
}

// Create blog_posts table if it doesn't exist
createBlogPostsTable();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetBlogPosts();
            break;
        case 'POST':
            handleCreateBlogPost();
            break;
        case 'PUT':
            handleUpdateBlogPost($postId);
            break;
        case 'DELETE':
            handleDeleteBlogPost($postId);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Blog Posts API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function createBlogPostsTable() {
    global $db;
    
    try {
        // Check if table exists
        $stmt = $db->query("SHOW TABLES LIKE 'blog_posts'");
        if ($stmt->fetch()) {
            return; // Table already exists
        }
        
        // Create blog_posts table
        $db->query("
            CREATE TABLE blog_posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                excerpt TEXT NOT NULL,
                content LONGTEXT NOT NULL,
                author_id INT NOT NULL,
                author_name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                tags JSON NOT NULL,
                image VARCHAR(500) NOT NULL,
                published BOOLEAN DEFAULT FALSE,
                seo_title VARCHAR(255) NULL,
                seo_description TEXT NULL,
                seo_keywords JSON NULL,
                read_time VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_slug (slug),
                INDEX idx_category (category),
                INDEX idx_published (published),
                INDEX idx_created_at (created_at)
            )
        ");
        
        error_log("Blog posts table created successfully");
        
    } catch (Exception $e) {
        error_log("Failed to create blog_posts table: " . $e->getMessage());
    }
}

function handleGetBlogPosts() {
    global $db;
    
    try {
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        $published = $_GET['published'] ?? '';
        $author = $_GET['author'] ?? '';
        
        $offset = ($page - 1) * $limit;
        
        // Build query with filters
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        
        if (!empty($category)) {
            $whereConditions[] = "category = ?";
            $params[] = $category;
        }
        
        if ($published !== '') {
            $whereConditions[] = "published = ?";
            $params[] = $published === 'true' ? 1 : 0;
        }
        
        if (!empty($author)) {
            $whereConditions[] = "author_name LIKE ?";
            $params[] = "%{$author}%";
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM blog_posts {$whereClause}";
        $stmt = $db->query($countQuery, $params);
        $totalResult = $stmt->fetch();
        $total = (int)$totalResult['total'];
        
        // Get blog posts
        $query = "
            SELECT id, title, slug, excerpt, content, author_id, author_name, category, tags, 
                   image, published, seo_title, seo_description, seo_keywords, read_time, 
                   created_at, updated_at
            FROM blog_posts
            {$whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->query($query, $params);
        $posts = [];
        
        while ($row = $stmt->fetch()) {
            $posts[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'slug' => $row['slug'],
                'excerpt' => $row['excerpt'],
                'content' => $row['content'],
                'author_id' => (int)$row['author_id'],
                'author_name' => $row['author_name'],
                'category' => $row['category'],
                'tags' => json_decode($row['tags'], true) ?: [],
                'image' => $row['image'],
                'published' => (bool)$row['published'],
                'seo_title' => $row['seo_title'],
                'seo_description' => $row['seo_description'],
                'seo_keywords' => json_decode($row['seo_keywords'], true) ?: [],
                'read_time' => $row['read_time'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
        }
        
        // Get categories for filter
        $categoriesStmt = $db->query("SELECT DISTINCT category FROM blog_posts ORDER BY category");
        $categories = [];
        while ($catRow = $categoriesStmt->fetch()) {
            $categories[] = $catRow['category'];
        }
        
        echo json_encode([
            'success' => true,
            'posts' => $posts,
            'categories' => $categories,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get blog posts error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve blog posts']);
    }
}

function handleCreateBlogPost() {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    // Validate and sanitize input
    $title = $security->sanitizeInput($_POST['title'] ?? '');
    $excerpt = $security->sanitizeInput($_POST['excerpt'] ?? '');
    $content = $_POST['content'] ?? ''; // Don't sanitize HTML content
    $category = $security->sanitizeInput($_POST['category'] ?? '');
    $tags = json_decode($_POST['tags'] ?? '[]', true);
    $image = $security->sanitizeInput($_POST['image'] ?? '', 'url');
    $uploadedFile = $_FILES['image'] ?? null;
    $published = (bool)($_POST['published'] ?? false);
    $seoTitle = $security->sanitizeInput($_POST['seo_title'] ?? '');
    $seoDescription = $security->sanitizeInput($_POST['seo_description'] ?? '');
    $seoKeywords = json_decode($_POST['seo_keywords'] ?? '[]', true);
    
    $errors = [];
    
    if (empty($title) || strlen($title) < 5) {
        $errors['title'] = 'Title must be at least 5 characters';
    }
    
    if (empty($excerpt) || strlen($excerpt) < 20) {
        $errors['excerpt'] = 'Excerpt must be at least 20 characters';
    }
    
    if (empty($content) || strlen($content) < 100) {
        $errors['content'] = 'Content must be at least 100 characters';
    }
    
    if (empty($category)) {
        $errors['category'] = 'Category is required';
    }
    
    if (!is_array($tags)) {
        $errors['tags'] = 'Tags must be an array';
    }
    
    $imagePath = null;
    if ($uploadedFile) {
        $uploadResult = handleImageUpload($uploadedFile);
        if (!$uploadResult['success']) {
            $errors['image'] = $uploadResult['error'];
        } else {
            $imagePath = $uploadResult['path'];
        }
    } elseif (!empty($image) && filter_var($image, FILTER_VALIDATE_URL)) {
        $imagePath = $image; // Use provided URL
    } else {
        $errors['image'] = 'Valid image URL or file upload is required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Generate slug from title
    $slug = generateSlug($title);
    
    // Check if slug already exists
    $stmt = $db->query("SELECT id FROM blog_posts WHERE slug = ?", [$slug]);
    if ($stmt->fetch()) {
        $slug = $slug . '-' . time(); // Make it unique
    }
    
    if (!$imagePath) {
        $imagePath = $image ?: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop'; // Fallback image
    }

    // Calculate read time
    $readTime = calculateReadTime($content);
    
    // Generate SEO data if not provided
    if (empty($seoTitle)) {
        $seoTitle = $title . ' | AccessIQ Tech Blog';
    }
    if (empty($seoDescription)) {
        $seoDescription = substr($excerpt, 0, 160);
    }
    if (empty($seoKeywords)) {
        $seoKeywords = $tags;
    }
    
    try {
        $stmt = $db->query(
            "INSERT INTO blog_posts (
                title, slug, excerpt, content, author_id, author_name, category, tags, 
                image, published, seo_title, seo_description, seo_keywords, read_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $title, $slug, $excerpt, $content, $admin['id'], $admin['name'], 
                $category, json_encode($tags), $imagePath, $published, 
                $seoTitle, $seoDescription, json_encode($seoKeywords), $readTime
            ]
        );
        
        $postId = $db->lastInsertId();
        
        // Log the action
        $security->logSecurityEvent('blog_post_created', [
            'post_id' => $postId,
            'admin_user_id' => $admin['id'],
            'title' => $title,
            'published' => $published
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Blog post created successfully',
            'post_id' => $postId,
            'slug' => $slug
        ]);
        
    } catch (Exception $e) {
        error_log("Create blog post error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create blog post']);
    }
}

function handleUpdateBlogPost($postId) {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    // Check if post exists
    $stmt = $db->query("SELECT id, title, slug, image FROM blog_posts WHERE id = ?", [$postId]);
    $existingPost = $stmt->fetch();
    
    if (!$existingPost) {
        http_response_code(404);
        echo json_encode(['error' => 'Blog post not found']);
        return;
    }
    
    // Validate and sanitize input
    $title = $security->sanitizeInput($_POST['title'] ?? '');
    $excerpt = $security->sanitizeInput($_POST['excerpt'] ?? '');
    $content = $_POST['content'] ?? ''; // Don't sanitize HTML content
    $category = $security->sanitizeInput($_POST['category'] ?? '');
    $tags = json_decode($_POST['tags'] ?? '[]', true);
    $image = $security->sanitizeInput($_POST['image'] ?? '', 'url');
    $uploadedFile = $_FILES['image'] ?? null;
    $published = (bool)($_POST['published'] ?? false);
    $seoTitle = $security->sanitizeInput($_POST['seo_title'] ?? '');
    $seoDescription = $security->sanitizeInput($_POST['seo_description'] ?? '');
    $seoKeywords = json_decode($_POST['seo_keywords'] ?? '[]', true);
    
    $errors = [];
    
    if (empty($title) || strlen($title) < 5) {
        $errors['title'] = 'Title must be at least 5 characters';
    }
    
    if (empty($excerpt) || strlen($excerpt) < 20) {
        $errors['excerpt'] = 'Excerpt must be at least 20 characters';
    }
    
    if (empty($content) || strlen($content) < 100) {
        $errors['content'] = 'Content must be at least 100 characters';
    }
    
    if (empty($category)) {
        $errors['category'] = 'Category is required';
    }
    
    if (!is_array($tags)) {
        $errors['tags'] = 'Tags must be an array';
    }
    
    $imagePath = null;
    if ($uploadedFile) {
        $uploadResult = handleImageUpload($uploadedFile);
        if (!$uploadResult['success']) {
            $errors['image'] = $uploadResult['error'];
        } else {
            $imagePath = $uploadResult['path'];
        }
    } elseif (!empty($image) && filter_var($image, FILTER_VALIDATE_URL)) {
        $imagePath = $image; // Use provided URL
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Generate new slug if title changed
    $slug = $existingPost['slug'];
    if ($title !== $existingPost['title']) {
        $newSlug = generateSlug($title);
        
        // Check if new slug already exists for a different post
        $stmt = $db->query("SELECT id FROM blog_posts WHERE slug = ? AND id != ?", [$newSlug, $postId]);
        if ($stmt->fetch()) {
            $newSlug = $newSlug . '-' . time(); // Make it unique
        }
        
        $slug = $newSlug;
    }
    
    if (!$imagePath) {
        $imagePath = $existingPost['image'] ?: $image; // Keep existing image if no new file uploaded
    }

    // Recalculate read time
    $readTime = calculateReadTime($content);
    
    // Generate SEO data if not provided
    if (empty($seoTitle)) {
        $seoTitle = $title . ' | AccessIQ Tech Blog';
    }
    if (empty($seoDescription)) {
        $seoDescription = substr($excerpt, 0, 160);
    }
    if (empty($seoKeywords)) {
        $seoKeywords = $tags;
    }
    
    try {
        $stmt = $db->query(
            "UPDATE blog_posts SET 
                title = ?, slug = ?, excerpt = ?, content = ?, category = ?, tags = ?, 
                image = ?, published = ?, seo_title = ?, seo_description = ?, seo_keywords = ?, 
                read_time = ?, updated_at = NOW()
             WHERE id = ?",
            [
                $title, $slug, $excerpt, $content, $category, json_encode($tags), 
                $imagePath, $published, $seoTitle, $seoDescription, json_encode($seoKeywords), 
                $readTime, $postId
            ]
        );
        
        // Log the action
        $security->logSecurityEvent('blog_post_updated', [
            'post_id' => $postId,
            'admin_user_id' => $admin['id'],
            'title' => $title,
            'old_title' => $existingPost['title'],
            'published' => $published
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Blog post updated successfully',
            'slug' => $slug
        ]);
        
    } catch (Exception $e) {
        error_log("Update blog post error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update blog post']);
    }
}

function handleDeleteBlogPost($postId) {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    // Check if post exists
    $stmt = $db->query("SELECT id, title FROM blog_posts WHERE id = ?", [$postId]);
    $existingPost = $stmt->fetch();
    
    if (!$existingPost) {
        http_response_code(404);
        echo json_encode(['error' => 'Blog post not found']);
        return;
    }
    
    try {
        // Hard delete the blog post
        $stmt = $db->query("DELETE FROM blog_posts WHERE id = ?", [$postId]);
        
        // Log the action
        $security->logSecurityEvent('blog_post_deleted', [
            'post_id' => $postId,
            'admin_user_id' => $admin['id'],
            'title' => $existingPost['title']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Blog post deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete blog post error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete blog post']);
    }
}

function generateSlug($title) {
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
}

function calculateReadTime($content) {
    $wordsPerMinute = 200;
    $words = str_word_count(strip_tags($content));
    $minutes = max(1, ceil($words / $wordsPerMinute));
    return $minutes . ' min read';
}

/**
 * Handles the uploaded image file, validates it, and moves it to a permanent location.
 *
 * @param array $fileData The $_FILES array entry for the uploaded file.
 * @return array An associative array with 'success' (boolean) and 'path' (string) or 'error' (string).
 */
function handleImageUpload($fileData) {
    // Check for upload errors
    if ($fileData['error'] !== UPLOAD_ERR_OK) {
        switch ($fileData['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return ['success' => false, 'error' => 'Uploaded file exceeds maximum size.'];
            case UPLOAD_ERR_PARTIAL:
                return ['success' => false, 'error' => 'File was only partially uploaded.'];
            case UPLOAD_ERR_NO_FILE:
                return ['success' => false, 'error' => 'No file was uploaded.'];
            case UPLOAD_ERR_NO_TMP_DIR:
                return ['success' => false, 'error' => 'Missing a temporary folder.'];
            case UPLOAD_ERR_CANT_WRITE:
                return ['success' => false, 'error' => 'Failed to write file to disk.'];
            case UPLOAD_ERR_EXTENSION:
                return ['success' => false, 'error' => 'A PHP extension stopped the file upload.'];
            default:
                return ['success' => false, 'error' => 'Unknown upload error.'];
        }
    }

    // Validate file type (MIME type)
    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($fileData['tmp_name']);

    if (!in_array($mimeType, $allowedMimeTypes)) {
        return ['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, WEBP images are allowed.'];
    }

    // Validate file size (e.g., max 5MB)
    $maxFileSize = 5 * 1024 * 1024; // 5 MB
    if ($fileData['size'] > $maxFileSize) {
        return ['success' => false, 'error' => 'File size exceeds 5MB limit.'];
    }

    // Generate a unique filename
    $fileExtension = pathinfo($fileData['name'], PATHINFO_EXTENSION);
    $newFileName = uniqid('blog_') . '.' . $fileExtension;

    // Define upload directory
    $uploadDir = __DIR__ . '/../../public/uploads/blog_images/';
    
    // Create directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true); // 0777 for full permissions, true for recursive
    }

    $destinationPath = $uploadDir . $newFileName;

    // Move the uploaded file
    if (move_uploaded_file($fileData['tmp_name'], $destinationPath)) {
        // Return relative path for database storage
        return ['success' => true, 'path' => '/uploads/blog_images/' . $newFileName];
    } else {
        return ['success' => false, 'error' => 'Failed to move uploaded file. Check server permissions.'];
    }
}
?>