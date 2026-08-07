<?php
/**
 * database_bridge.php
 * Smart Employee Time Tracking System
 *
 * PURPOSE: Acts ONLY as a lightweight XAMPP/MySQL database bridge.
 * All business logic, authentication, and APIs are handled by Node.js + Express.js.
 * This file provides database connectivity verification and a secure query bridge
 * specifically for the Node.js backend when needed.
 */

// ─── CORS & Security Headers ────────────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5000');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Bridge-Key');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Bridge Security Key ─────────────────────────────────────────────────────
// Must match BRIDGE_SECRET_KEY in backend .env
define('BRIDGE_SECRET_KEY', getenv('BRIDGE_SECRET_KEY') ?: 'timetrack_bridge_secret_2024');

// ─── Database Configuration ───────────────────────────────────────────────────
define('DB_HOST',     getenv('DB_HOST')     ?: 'localhost');
define('DB_PORT',     getenv('DB_PORT')     ?: '3306');
define('DB_USER',     getenv('DB_USER')     ?: 'root');
define('DB_PASS',     getenv('DB_PASS')     ?: '');
define('DB_NAME',     getenv('DB_NAME')     ?: 'timetrack_db');
define('DB_CHARSET',  'utf8mb4');

// ─── Response Helper ──────────────────────────────────────────────────────────
function jsonResponse(bool $success, $data = null, string $message = '', int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data,
        'ts'      => time()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ─── Bridge Key Validation ────────────────────────────────────────────────────
function validateBridgeKey(): void {
    $key = $_SERVER['HTTP_X_BRIDGE_KEY'] ?? '';
    if (!hash_equals(BRIDGE_SECRET_KEY, $key)) {
        jsonResponse(false, null, 'Unauthorized: Invalid bridge key', 401);
    }
}

// ─── Database Connection ──────────────────────────────────────────────────────
function getDbConnection(): mysqli {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int)DB_PORT);

    if ($conn->connect_error) {
        jsonResponse(false, null, 'Database connection failed: ' . $conn->connect_error, 500);
    }

    $conn->set_charset(DB_CHARSET);
    return $conn;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// Public endpoint: health/ping check (no key needed)
if ($action === 'ping') {
    try {
        $conn = getDbConnection();
        $result = $conn->query("SELECT VERSION() as version, NOW() as server_time");
        $row = $result->fetch_assoc();
        $conn->close();
        jsonResponse(true, [
            'db_connected'  => true,
            'db_version'    => $row['version'],
            'server_time'   => $row['server_time'],
            'bridge_status' => 'operational'
        ], 'Database bridge is operational');
    } catch (Exception $e) {
        jsonResponse(false, ['db_connected' => false], 'Database connection failed', 500);
    }
}

// All other actions require bridge key
validateBridgeKey();

// ─── Actions ──────────────────────────────────────────────────────────────────
switch ($action) {

    // Check if database & tables exist (used by Node.js on startup)
    case 'check_schema':
        $conn = getDbConnection();
        $tables = ['users', 'roles', 'categories', 'sessions', 'reports', 'alerts', 'activity_logs', 'settings'];
        $existing = [];
        foreach ($tables as $table) {
            $res = $conn->query("SHOW TABLES LIKE '$table'");
            $existing[$table] = ($res->num_rows > 0);
        }
        $conn->close();
        $allExist = !in_array(false, $existing, true);
        jsonResponse(true, ['tables' => $existing, 'schema_ready' => $allExist], 'Schema check complete');
        break;

    // Get database statistics (used by Node.js admin analytics)
    case 'db_stats':
        $conn = getDbConnection();
        $stats = [];

        $tables = ['users', 'sessions', 'categories', 'alerts', 'activity_logs'];
        foreach ($tables as $table) {
            $res = $conn->query("SELECT COUNT(*) as cnt FROM `$table`");
            $row = $res->fetch_assoc();
            $stats[$table . '_count'] = (int)$row['cnt'];
        }

        // Active sessions
        $res = $conn->query("SELECT COUNT(*) as cnt FROM sessions WHERE status IN ('active','paused')");
        $stats['active_sessions'] = (int)$res->fetch_assoc()['cnt'];

        // Today's sessions
        $res = $conn->query("SELECT COUNT(*) as cnt FROM sessions WHERE DATE(start_time) = CURDATE()");
        $stats['today_sessions'] = (int)$res->fetch_assoc()['cnt'];

        $conn->close();
        jsonResponse(true, $stats, 'Database stats retrieved');
        break;

    // Execute safe read-only query (SELECT only — no writes allowed via bridge)
    case 'raw_select':
        $input = json_decode(file_get_contents('php://input'), true);
        $sql   = trim($input['sql'] ?? '');

        if (empty($sql)) {
            jsonResponse(false, null, 'No SQL provided', 400);
        }

        // Safety: only allow SELECT statements
        if (!preg_match('/^\s*SELECT\s/i', $sql)) {
            jsonResponse(false, null, 'Only SELECT queries are permitted via bridge', 403);
        }

        // Block dangerous keywords
        $blocked = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'TRUNCATE', 'ALTER', 'CREATE', 'EXEC', 'UNION'];
        foreach ($blocked as $kw) {
            if (stripos($sql, $kw) !== false) {
                jsonResponse(false, null, "Blocked keyword detected: $kw", 403);
            }
        }

        $conn = getDbConnection();
        $result = $conn->query($sql);

        if (!$result) {
            $conn->close();
            jsonResponse(false, null, 'Query error: ' . $conn->error, 500);
        }

        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        $conn->close();
        jsonResponse(true, ['rows' => $rows, 'count' => count($rows)], 'Query executed');
        break;

    default:
        jsonResponse(false, null, 'Unknown action', 400);
}
?>
