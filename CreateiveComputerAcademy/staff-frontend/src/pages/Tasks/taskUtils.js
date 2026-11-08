/**
 * Creative Computer Academy (CCA) - Task Utility Functions
 * Handles time formatting, live stopwatch calculations, multi-tier category filtering, and status grouping.
 */

/**
 * Formats time spent on a task into "Xh Ym Zs".
 * If task is currently "In Progress" and timer is "Running", adds live elapsed seconds using session_start_time.
 */
export const formatTimeSpent = (task) => {
  if (!task) return '0h 0m 0s';
  let totalSecs = parseInt(task.total_time_spent || 0, 10);

  if (task.status === 'In Progress' && task.timer_status === 'Running' && task.session_start_time) {
    let cleanStr = String(task.session_start_time).trim().replace(' ', 'T');
    if (!cleanStr.includes('+') && !cleanStr.endsWith('Z')) {
      cleanStr += '+06:00';
    }
    const start = new Date(cleanStr).getTime();
    if (!isNaN(start)) {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      totalSecs += diff;
    }
  }

  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${hrs}h ${mins}m ${secs}s`;
};

/**
 * Filters tasks using Search Keyword, 3-level Cascading Categories, and Date.
 */
export const filterTasks = (tasks = [], {
  searchTerm = '',
  selectedCategoryFilter = 'all',
  selectedSubcategoryFilter = 'all',
  selectedChildCategoryFilter = 'all',
  dateFilter = ''
} = {}) => {
  return tasks.filter(task => {
    // 1. Search Query Filter (Driven by Header Search Bar)
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        (task.title || '').toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.category || '').toLowerCase().includes(term) ||
        (task.main_category_name || '').toLowerCase().includes(term) ||
        (task.sub_category_name || '').toLowerCase().includes(term) ||
        (task.child_category_name || '').toLowerCase().includes(term) ||
        (task.category_path || '').toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // 2. 3-Level Cascading Category Filters
    if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
      const catLow = selectedCategoryFilter.toLowerCase().trim();
      const mainName = (task.main_category_name || '').toLowerCase().trim();
      const catName = (task.category_name || '').toLowerCase().trim();
      const directCat = (task.category || '').toLowerCase().trim();
      const catPath = (task.category_path || '').toLowerCase().trim();

      const matchesCat =
        mainName === catLow ||
        directCat === catLow ||
        catPath.startsWith(catLow) ||
        catPath.includes(catLow) ||
        catName === catLow;
      if (!matchesCat) return false;
    }

    if (selectedSubcategoryFilter && selectedSubcategoryFilter !== 'all') {
      const subLow = selectedSubcategoryFilter.toLowerCase().trim();
      const subName = (task.sub_category_name || '').toLowerCase().trim();
      const directCat = (task.category || '').toLowerCase().trim();
      const catPath = (task.category_path || '').toLowerCase().trim();

      const matchesSub =
        subName === subLow ||
        directCat === subLow ||
        catPath.includes(subLow);
      if (!matchesSub) return false;
    }

    if (selectedChildCategoryFilter && selectedChildCategoryFilter !== 'all') {
      const childLow = selectedChildCategoryFilter.toLowerCase().trim();
      const childName = (task.child_category_name || '').toLowerCase().trim();
      const directCat = (task.category || '').toLowerCase().trim();
      const catPath = (task.category_path || '').toLowerCase().trim();

      const matchesChild =
        childName === childLow ||
        directCat === childLow ||
        catPath.includes(childLow);
      if (!matchesChild) return false;
    }

    // 3. Date Filter
    const taskDate = task.assign_date || task.created_at;
    const matchesDate = !dateFilter || task.status === 'Unassigned' || (taskDate && taskDate.startsWith(dateFilter));
    if (!matchesDate) return false;

    return true;
  });
};

/**
 * Groups a filtered array of tasks into their corresponding kanban/tab status buckets.
 */
export const groupTasksByStatus = (filteredTasks = []) => {
  return {
    'Unassigned': filteredTasks.filter(t => t.status === 'Unassigned'),
    'To-Do': filteredTasks.filter(t => t.status === 'To-Do'),
    'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
    'In Review': filteredTasks.filter(t => t.status === 'In Review'),
    'Rejected': filteredTasks.filter(t => t.status === 'Rejected'),
    'Completed': filteredTasks.filter(t => t.status === 'Completed'),
  };
};

