export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

export const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Due today', overdue: false, urgent: true };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false, urgent: true };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
};

export const PROJECT_COLORS = [
  '#e85d26','#2563eb','#16a34a','#7c3aed',
  '#d97706','#dc2626','#0891b2','#be185d',
];

export const avatarGradients = [
  'linear-gradient(135deg,#e85d26,#f59e0b)',
  'linear-gradient(135deg,#2563eb,#7c3aed)',
  'linear-gradient(135deg,#16a34a,#0891b2)',
  'linear-gradient(135deg,#dc2626,#be185d)',
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#d97706,#e85d26)',
];

export const getGradient = (str = '') => {
  const code = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarGradients[code % avatarGradients.length];
};
