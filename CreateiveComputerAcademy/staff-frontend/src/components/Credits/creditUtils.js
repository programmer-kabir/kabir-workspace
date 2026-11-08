export const getTransactionInfo = (tx) => {
  if (!tx) return {};

  const isPenalty = 
    tx.type === 'rejection_penalty' || 
    tx.type === 'task_penalty' || 
    tx.type === 'rejection' ||
    tx.type === 'admin_deduct' || 
    Number(tx.amount) < 0 ||
    (typeof tx.description === 'string' && tx.description.toLowerCase().includes('reject'));

  const isPositive = Number(tx.amount) > 0;
  const meta = tx.meta_data || {};

  let badgeText = isPenalty ? 'Task Rejected' : isPositive ? 'Task Approved' : 'Transaction';
  let badgeClass = isPenalty
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
    : isPositive
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';

  let mainTitle = tx.description || 'Transaction Record';
  let reasonText = meta.rejection_reason || meta.reason || meta.notes || '';
  let categoryName = meta.category_name || tx.task_category_name || '';
  let taskTitle = meta.task_title || tx.task_title || '';

  if (tx.type === 'marketplace_upload') {
    badgeText = 'Marketplace Upload (+1)';
    badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
    mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Marketplace Upload');
  } else if (tx.type === 'marketplace_dayal_upload') {
    badgeText = 'Dayal Stock Upload (+1)';
    badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Dayal Stock Upload');
  } else if (tx.type === 'marketplace_approved') {
    badgeText = 'Marketplace Approved (+2)';
    badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Marketplace Approved');
  } else if (tx.type === 'marketplace_rejected') {
    badgeText = 'Marketplace Rejected (-1)';
    badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
    mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Marketplace Rejected');
  } else if (isPenalty) {
    badgeText = 'Task Rejected (-1)';
    badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
    mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Task Revision');

    if (!reasonText && tx.description && tx.description.includes('("')) {
      const match = tx.description.match(/\("([^"]+)"\)/);
      if (match) reasonText = match[1];
    }
  } else if (tx.type === 'task_reward' || (typeof tx.description === 'string' && (tx.description.toLowerCase().includes('reward') || tx.description.toLowerCase().includes('approved')))) {
    badgeText = `Task Approved (+${tx.amount})`;
    badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    mainTitle = taskTitle || (tx.reference_id ? `Task #${tx.reference_id}` : 'Task Completed');
  } else if (tx.type === 'transfer_sent') {
    badgeText = 'Transfer Sent';
    badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
    mainTitle = `Sent to ${tx.receiver_name || meta.receiver_name || 'Teammate'}`;
  } else if (tx.type === 'transfer_received') {
    badgeText = 'Transfer Received';
    badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
    mainTitle = `Received from ${tx.sender_name || meta.sender_name || 'Teammate'}`;
  } else if (tx.type === 'admin_grant' || tx.type === 'bonus') {
    badgeText = 'Bonus / Grant';
    badgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
    mainTitle = tx.description;
  } else if (tx.type === 'admin_deduct') {
    badgeText = 'Admin Deduction';
    badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
    mainTitle = tx.description;
  }

  if (typeof mainTitle === 'string' && mainTitle.includes(' — Task Rejection:')) {
    const match = mainTitle.match(/Task Rejection:\s*'([^']+)'/);
    if (match) mainTitle = match[1];
  } else if (typeof mainTitle === 'string' && mainTitle.includes(' — Task Reward:')) {
    const match = mainTitle.match(/Task Reward:\s*'([^']+)'/);
    if (match) mainTitle = match[1];
  }

  return { isPenalty, isPositive, badgeText, badgeClass, mainTitle, taskTitle, reasonText, categoryName, meta };
};

