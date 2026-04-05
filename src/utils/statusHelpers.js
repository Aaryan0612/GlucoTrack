export function getReadingStatus(value, mealType) {
  if (mealType === 'fasting') {
    if (value < 70) return 'low';
    if (value <= 99) return 'normal';
    if (value <= 125) return 'caution';
    return 'high';
  }
  
  if (mealType === 'post-meal') {
    if (value < 70) return 'low';
    if (value <= 139) return 'normal';
    if (value <= 199) return 'caution';
    return 'high';
  }
  
  // For bedtime and other
  if (value < 70) return 'low';
  if (value <= 130) return 'normal';
  if (value <= 180) return 'caution';
  return 'high';
}

export function getStatusColor(status) {
  const colors = {
    normal: 'var(--color-normal)',
    caution: 'var(--color-caution)',
    high: 'var(--color-high)',
    low: 'var(--color-low)'
  };
  return colors[status] || colors.normal;
}

export function getStatusLabel(status) {
  const labels = {
    normal: 'Normal',
    caution: 'Caution',
    high: 'High',
    low: 'Low'
  };
  return labels[status] || 'Normal';
}
