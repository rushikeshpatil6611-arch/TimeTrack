// Format seconds to HH:MM:SS
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

// Format seconds to human readable
export const formatDurationHuman = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Get initials from name
export const getInitials = (name = '') => {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// Format date
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Format datetime
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  let str = dateStr;
  if (!str.endsWith('Z') && !str.includes('+')) {
    str = str.replace(' ', 'T') + 'Z';
  }
  return new Date(str).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Seconds to hours decimal
export const toHours = (seconds) => (seconds / 3600).toFixed(1);

// Percentage
export const pct = (val, total) => total ? Math.round((val / total) * 100) : 0;

// Clamp
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// Generate gradient colors for charts
export const chartColors = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#64748b','#f97316','#84cc16'
];

// Status color mapping
export const statusColor = (status) => ({
  active: 'success', paused: 'warning', completed: 'primary',
  cancelled: 'danger', inactive: 'danger'
})[status] || 'muted';

// Truncate text
export const truncate = (str, len = 40) =>
  str && str.length > len ? str.slice(0, len) + '…' : (str || '');
