</main>

<footer style="margin-top: auto; padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.05);">
    <div style="max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
            &copy; 2026 ROSCA Committee Management Web App. All rights reserved.
        </div>
        <div>
            <span>10-Member Daily Samity</span> &bull; 
            <span style="color: var(--accent-gold);">Cycle 2026-2027</span>
        </div>
    </div>
</footer>

<!-- Global Toast Container -->
<div id="toast-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;"></div>

<script>
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.padding = '0.85rem 1.25rem';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '500';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.75rem';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.transition = 'all 0.3s ease';
    
    if (type === 'success') {
        toast.style.borderLeft = '4px solid var(--accent-emerald)';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> ${message}`;
    } else {
        toast.style.borderLeft = '4px solid var(--accent-rose)';
        toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> ${message}`;
    }
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
</script>

</body>
</html>
