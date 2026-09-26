import axios from 'axios';
import { useMemo } from 'react';
import { toast } from 'sonner';

export const useTaskActions = ({ apiBase, currentUser, setComments, setAddingComment, setNewComment, setCommentImage, setCommentImagePreview, commentsEndRef, setCommentsLoading, setHistoryTask, setIsHistoryOpen, setLoadingHistory, setActiveHistoryLogs, setEditingCommentId, editCommentText, setEditCommentText, setSelectedTask, setSelectedTab, setEditContent, setEditTaskId, setEditingTaskId, setTasks, setStaff, setDepartments, setWorkloads, setLoading, newTask, setNewTask, setActionLoading, setIsCreateOpen, departments, EMPTY_TASK_FORM, staff, editTask, setEditTask, setIsEditOpen, taskToDelete, setTaskToDelete, setIsDetailsOpen, setDetailsTask, tasks, dateFilter, customDateRange, searchTerm, selectedDeptFilter, selectedCategoryFilter, selectedSubcategoryFilter, selectedChildCategoryFilter, selectedStaffFilter, groupBy, rejectTask, setRejectTask, rejectReason, setRejectReason }) => {

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            const res = await axios.post(`${apiBase}api/tasks/task_comments.php`, {
                action: 'delete', comment_id: commentId, user_id: currentUser.id
            });
            if (res.data.status === 'success') setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) { console.error('Failed to delete comment', err); }
    };

    const handleAddComment = async (e, detailsTask, newComment, commentImage) => {
        e.preventDefault();
        if ((!newComment.trim() && !commentImage) || !detailsTask) return;
        setAddingComment(true);

        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('task_id', detailsTask.id);
        formData.append('user_id', currentUser.id);
        formData.append('comment', newComment.trim());
        if (commentImage) {
            formData.append('image', commentImage);
        }

        try {
            const res = await axios.post(`${apiBase}api/tasks/task_comments.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === 'success') {
                setComments(prev => {
                    if (prev.find(c => String(c.id) === String(res.data.comment.id))) return prev;
                    return [...prev, res.data.comment];
                });
                setNewComment('');
                setCommentImage(null);
                setCommentImagePreview(null);
                setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (err) { console.error('Failed to add comment', err); }
        finally { setAddingComment(false); }
    };

    const fetchComments = async (taskId) => {
        setCommentsLoading(true);
        try {
            const res = await axios.post(`${apiBase}api/tasks/task_comments.php`, {
                action: 'get', task_id: taskId
            });
            if (res.data.status === 'success') {
                const uniqueComments = [];
                const seenIds = new Set();
                (res.data.comments || []).forEach(c => {
                    if (!seenIds.has(c.id)) {
                        seenIds.add(c.id);
                        uniqueComments.push(c);
                    }
                });
                setComments(uniqueComments);
                setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (err) { console.error('Failed to fetch comments', err); }
        finally { setCommentsLoading(false); }
    };

    const fetchTaskHistory = async (task) => {
        setHistoryTask(task);
        setIsHistoryOpen(true);
        setLoadingHistory(true);
        try {
            const res = await axios.get(`${apiBase}api/admin/tasks/get_task_logs.php?task_id=${task.id}`);
            if (res.data.status === 'success') {
                setActiveHistoryLogs(res.data.data);
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to load task history.");
        } finally {
            setLoadingHistory(false);
        }
    };
    const handleSaveEdit = async (commentId) => {
        if (!editCommentText.trim()) return;
        try {
            const res = await axios.post(`${apiBase}api/tasks/task_comments.php`, {
                action: 'update',
                comment_id: commentId,
                user_id: currentUser.id,
                comment: editCommentText.trim()
            });
            if (res.data.status === 'success') {
                setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment: editCommentText.trim() } : c));
                setEditingCommentId(null);
                setEditCommentText('');
            }
        } catch (err) { console.error('Failed to update comment', err); }
    };

    const joditConfig = useMemo(() => ({
        readonly: false,
        height: 560,
        placeholder: 'Type detailed task instructions here...',
        toolbarSticky: false,
        style: { fontFamily: 'inherit', background: 'transparent', border: 'none' },
        buttons: [
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'ul', 'ol', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'fullsize',
        ],
        removeButtons: ['about', 'print', 'source'],
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: 'insert_as_html',

        // ─── Inline Image Upload ────────────────────────────────────────────
        uploader: {
            url: `${apiBase}api/admin/tasks/task_image_upload.php`,
            format: 'json',
            method: 'POST',
            filesVariableName: () => 'files',
            isSuccess: (resp) => !!(resp && resp.files && resp.files.length),
            getMsg: (resp) => (resp && resp.error) ? resp.error : 'Image upload failed.',
            process: (resp) => ({
                files: resp.files || [],
                baseurl: apiBase,
                error: resp.error || '',
                msg: resp.error || '',
            }),
            // Direct value assignment — bypasses selection/focus/popup issues entirely.
            // Appends the uploaded image to whatever is already in the editor.
            defaultHandlerSuccess(data) {
                const editor = this.j || this.jodit;
                if (!editor || !data.files || !data.files.length) return;

                const imgs = data.files
                    .map(f => `<img src="${data.baseurl + f}" alt="uploaded" style="max-width:100%;height:auto;display:block;margin:8px 0;" />`)
                    .join('');

                // Set value directly — no cursor/focus dependency at all
                editor.value = (editor.value || '') + imgs;

                // Close Jodit's image popup so the user can see the result
                try { editor.e.fire('closeAll'); } catch (_) { }
            },
        },
    }), [apiBase]);


    const fetchTasksAndStaff = async (isSilent = false) => {
        const cachedTasks = (() => {
            try {
                const c = sessionStorage.getItem('cca_admin_tasks');
                return c ? JSON.parse(c) : null;
            } catch (_) { return null; }
        })();

        const hasExistingData = (tasks && tasks.length > 0) || (cachedTasks && cachedTasks.length > 0);

        if (!isSilent && !hasExistingData) {
            setLoading(true);
        } else {
            setLoading(false);
        }

        const safeSaveSession = (key, data) => {
            try {
                sessionStorage.setItem(key, JSON.stringify(data));
            } catch (err) {
                try {
                    if (Array.isArray(data)) {
                        const lightData = data.map(item => {
                            let desc = item.description || '';
                            if (typeof desc === 'string' && desc.includes('data:image/')) {
                                desc = desc.replace(/data:image\/[^;]+;base64,[^"'\s)]+/g, '[img]');
                            }
                            return { ...item, description: desc };
                        });
                        sessionStorage.setItem(key, JSON.stringify(lightData));
                    }
                } catch (innerErr) {
                    console.warn('Could not store in sessionStorage due to size:', key, innerErr);
                }
            }
        };

        // 1. Fetch main tasks first and render immediately
        const tasksPromise = axios.get(`${apiBase}api/admin/tasks/get_all_tasks.php`)
            .then(res => {
                if (res.data.status === 'success') {
                    setTasks(res.data.data);
                    safeSaveSession('cca_admin_tasks', res.data.data);
                }
            })
            .catch(err => console.error('Error fetching tasks:', err))
            .finally(() => setLoading(false));

        // 2. Fetch ancillary data (staff, depts, workload) in parallel without blocking UI
        const staffPromise = axios.get(`${apiBase}api/admin/staff/get_all_staff.php`)
            .then(res => {
                if (res.data.status === 'success') {
                    setStaff(res.data.data);
                    safeSaveSession('cca_admin_staff', res.data.data);
                }
            })
            .catch(err => console.error('Error fetching staff:', err));

        const deptPromise = axios.get(`${apiBase}api/admin/departments/get_departments.php`)
            .then(res => {
                if (res.data.status === 'success') {
                    setDepartments(res.data.data);
                    safeSaveSession('cca_admin_depts', res.data.data);
                }
            })
            .catch(err => console.error('Error fetching departments:', err));

        const workloadPromise = axios.get(`${apiBase}api/admin/tasks/get_workload.php`)
            .then(res => {
                if (res.data.status === 'success') {
                    setWorkloads(res.data.data);
                    safeSaveSession('cca_admin_workloads', res.data.data);
                }
            })
            .catch(() => { });

        await Promise.allSettled([tasksPromise, staffPromise, deptPromise, workloadPromise]);
    };
    const handleCreateTask = async (e, customData = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const activeTask = customData || newTask;
        if (!activeTask.title?.trim()) {
            toast.error('Task title is required!');
            return;
        }
        setActionLoading(true);
        try {
            // Filter out empty links and serialize array as JSON string for storage
            const links = (Array.isArray(activeTask.ref_links) ? activeTask.ref_links : [activeTask.ref_links || ''])
                .filter(l => l.trim());
            const sanitizeImages = (arr) => {
                if (!Array.isArray(arr)) return [];
                return arr.filter(item => typeof item === 'string' && item.trim() !== '' && item !== '{}' && item !== '[object Object]');
            };
            const imgs = sanitizeImages(activeTask.ref_image);
            const visImgs = sanitizeImages(activeTask.visual_image);
            const dept = departments.find(d => d.name === activeTask.category);
            const payload = {
                ...activeTask,
                department_id: dept ? dept.id : null,
                ref_links: JSON.stringify(links),
                ref_image: JSON.stringify(imgs),
                visual_image: JSON.stringify(visImgs),
                blueprint_data: activeTask.blueprint_data ? JSON.stringify(activeTask.blueprint_data) : null
            };
            const res = await axios.post(`${apiBase}api/admin/tasks/create_task.php`, payload);
            if (res.data.status === 'success') {
                await fetchTasksAndStaff();
                setIsCreateOpen(false);
                setNewTask(EMPTY_TASK_FORM);
                toast.success('Task assigned successfully!');
            } else {
                toast.error(res.data.message || 'Failed to assign task');
            }
        } catch (error) {
            toast.error(`Failed to assign task: ${error.response?.data?.message || error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (task) => {
        const matchedStaff = staff.find(s => s.name === task.assigned_to_name);

        let parsedLinks = [''];
        if (task.ref_links) {
            try {
                const decoded = JSON.parse(task.ref_links);
                parsedLinks = Array.isArray(decoded) ? (decoded.length ? decoded : ['']) : [task.ref_links];
            } catch {
                parsedLinks = [task.ref_links];
            }
        }

        let parsedImages = [];
        if (task.ref_image) {
            try {
                const decoded = JSON.parse(task.ref_image);
                parsedImages = Array.isArray(decoded) ? decoded : [task.ref_image];
            } catch {
                parsedImages = [task.ref_image];
            }
        }

        let parsedBlueprint = null;
        if (task.blueprint_data) {
            try {
                parsedBlueprint = typeof task.blueprint_data === 'string' ? JSON.parse(task.blueprint_data) : task.blueprint_data;
            } catch (e) {
                console.error('Failed to parse blueprint_data:', e);
                parsedBlueprint = null;
            }
        }

        const activeVariant = Array.isArray(task.blueprint_variants)
            ? (task.blueprint_variants.find(v => v.is_active) || task.blueprint_variants[0])
            : null;
        const activeBlueprintData = activeVariant?.blueprint_data || parsedBlueprint;

        setEditTask({
            task_id: task.id,
            title: task.title || '',
            description: task.description || '',
            category: task.category || 'Design',
            category_path: task.category_path || task.category || 'Design',
            category_id: task.category_id || null,
            subcategory_id: task.subcategory_id || null,
            child_category_id: task.child_category_id || null,
            assigned_to: matchedStaff ? matchedStaff.id : '',
            assign_date: task.assign_date || new Date().toISOString().split('T')[0],
            deadline: task.deadline || '',
            deadline_time: task.deadline_time || '',
            ref_links: parsedLinks,
            ref_image: parsedImages,
            visual_image: task.visual_image ? (Array.isArray(JSON.parse(task.visual_image || '[]')) ? JSON.parse(task.visual_image || '[]') : [task.visual_image]) : [],
            submission_link: task.submission_link || '',
            creation_mode: task.creation_mode || (activeBlueprintData || (task.blueprint_variants && task.blueprint_variants.length > 0) ? 'agentic' : 'manual'),
            blueprint_data: activeBlueprintData,
            blueprint_variants: task.blueprint_variants || [],
            priority: task.priority || 'Medium',
            custom_credit: task.custom_credit !== null && task.custom_credit !== undefined ? String(task.custom_credit) : '',
            checklists: task.checklists ? (typeof task.checklists === 'string' ? JSON.parse(task.checklists) : task.checklists) : []
        });
        setIsEditOpen(true);
    };

    const handleEditTask = async (e, overrideFormData = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const dataToSave = overrideFormData || editTask;
        if (!dataToSave || !dataToSave.title?.trim() || !dataToSave.category?.trim()) {
            toast.error('Title and Category are required!');
            return;
        }
        setActionLoading(true);
        try {
            const links = (Array.isArray(dataToSave.ref_links) ? dataToSave.ref_links : [dataToSave.ref_links || ''])
                .filter(l => typeof l === 'string' && l.trim());
            const imgs = Array.isArray(dataToSave.ref_image) ? dataToSave.ref_image : [];
            const visImgs = Array.isArray(dataToSave.visual_image) ? dataToSave.visual_image : [];
            const dept = departments.find(d => d.name === dataToSave.category);
            const payload = {
                ...dataToSave,
                department_id: dept ? dept.id : null,
                ref_links: JSON.stringify(links),
                ref_image: JSON.stringify(imgs),
                visual_image: JSON.stringify(visImgs),
                creation_mode: dataToSave.creation_mode || (dataToSave.blueprint_data || (dataToSave.blueprint_variants && dataToSave.blueprint_variants.length > 0) ? 'agentic' : 'manual'),
                blueprint_data: dataToSave.blueprint_data ? (typeof dataToSave.blueprint_data === 'string' ? dataToSave.blueprint_data : JSON.stringify(dataToSave.blueprint_data)) : null,
                blueprint_variants: dataToSave.blueprint_variants || []
            };
            const res = await axios.post(`${apiBase}api/admin/tasks/edit_task.php`, payload);
            if (res.data.status === 'success') {
                toast.success('Task updated successfully!');
                await fetchTasksAndStaff();
                setIsEditOpen(false);
                setEditTask(null);
            } else {
                toast.error(res.data.message || 'Failed to update task.');
            }
        } catch (error) {
            toast.error(`Failed to update task: ${error.response?.data?.message || error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        const targetId = taskToDelete.id || taskToDelete.task_id;
        const prevTasks = [...tasks];

        // Optimistic UI removal
        setTasks(prev => prev.filter(t => (t.id || t.task_id) !== targetId));
        setTaskToDelete(null);
        setIsDetailsOpen(false);
        setDetailsTask(null);
        setIsEditOpen(false);
        setEditTask(null);
        setActionLoading(true);

        try {
            const res = await axios.post(`${apiBase}api/admin/tasks/delete_task.php`, { task_id: targetId });
            if (res.data.status === 'success') {
                toast.success('Task deleted successfully');
                fetchTasksAndStaff(true);
            } else {
                setTasks(prevTasks);
                toast.error(res.data.message || 'Failed to delete task');
            }
        } catch (error) {
            setTasks(prevTasks);
            toast.error(`Failed to delete task: ${error.response?.data?.message || error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDuplicateTask = (task) => {
        const matchedStaff = staff.find(s => s.name === task.assigned_to_name);

        let parsedLinks = [''];
        if (task.ref_links) {
            try {
                const decoded = JSON.parse(task.ref_links);
                parsedLinks = Array.isArray(decoded) ? (decoded.length ? decoded : ['']) : [task.ref_links];
            } catch {
                parsedLinks = [task.ref_links];
            }
        }

        let parsedImages = [];
        if (task.ref_image) {
            try {
                const decoded = JSON.parse(task.ref_image);
                parsedImages = Array.isArray(decoded) ? decoded : [task.ref_image];
            } catch {
                parsedImages = [task.ref_image];
            }
        }

        setNewTask({
            title: task.title,
            description: task.description,
            category: task.category,
            assigned_to: matchedStaff ? String(matchedStaff.id) : '',
            assign_date: new Date().toISOString().split('T')[0],
            ref_links: parsedLinks,
            ref_image: parsedImages,
        });
        setIsCreateOpen(true);
    };

    const handleStatusChange = async (taskId, newStatus) => {
        const prevTasks = [...tasks];
        // Optimistic instant state update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        toast.success(`Status updated to ${newStatus}`);

        try {
            const res = await axios.post(`${apiBase}api/admin/tasks/update_task_status.php`, {
                task_id: taskId,
                status: newStatus,
                changed_by: currentUser?.id ?? null,
            });
            if (res.data.status === 'success') {
                fetchTasksAndStaff(true);
            } else {
                setTasks(prevTasks);
                toast.error(res.data.message || 'Failed to update task.');
            }
        } catch {
            setTasks(prevTasks);
            toast.error('Failed to update task.');
        }
    };

    const filteredTasks = useMemo(() => {
        let result = tasks;

        if (dateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfYear = new Date(today.getFullYear(), 0, 1);

            result = result.filter(t => {
                const taskDate = new Date(t.assign_date || t.created_at);
                if (isNaN(taskDate)) return true;

                if (dateFilter === 'today') {
                    const tDate = new Date(taskDate);
                    tDate.setHours(0, 0, 0, 0);
                    return tDate.getTime() === today.getTime();
                }
                if (dateFilter === 'specific') {
                    if (!customDateRange.start) return true;
                    const targetDate = new Date(customDateRange.start);
                    targetDate.setHours(0, 0, 0, 0);
                    const tDate = new Date(taskDate);
                    tDate.setHours(0, 0, 0, 0);
                    return tDate.getTime() === targetDate.getTime();
                }
                if (dateFilter === 'month') return taskDate >= startOfMonth;
                if (dateFilter === 'year') return taskDate >= startOfYear;
                if (dateFilter === 'custom') {
                    const s = customDateRange.start ? new Date(customDateRange.start) : null;
                    const e = customDateRange.end ? new Date(customDateRange.end) : null;
                    if (e) e.setHours(23, 59, 59, 999);

                    if (s && e) return taskDate >= s && taskDate <= e;
                    if (s) return taskDate >= s;
                    if (e) return taskDate <= e;
                    return true;
                }
                return true;
            });
        }

        if (selectedStaffFilter !== 'all') {
            if (selectedStaffFilter === 'unassigned') {
                result = result.filter(t => !t.assigned_to_name);
            } else {
                result = result.filter(t => t.assigned_to_name === selectedStaffFilter);
            }
        }

        // ─── 3-Level Cascading Category Filters ───
        if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
            const catLow = selectedCategoryFilter.toLowerCase().trim();
            result = result.filter(t => {
                const mainName = (t.main_category_name || '').toLowerCase().trim();
                const catName = (t.category_name || '').toLowerCase().trim();
                const directCat = (t.category || '').toLowerCase().trim();
                const catPath = (t.category_path || '').toLowerCase().trim();

                return mainName === catLow ||
                    directCat === catLow ||
                    catPath.startsWith(catLow) ||
                    catPath.includes(catLow) ||
                    catName === catLow;
            });
        }

        if (selectedSubcategoryFilter && selectedSubcategoryFilter !== 'all') {
            const subLow = selectedSubcategoryFilter.toLowerCase().trim();
            result = result.filter(t => {
                const subName = (t.sub_category_name || '').toLowerCase().trim();
                const directCat = (t.category || '').toLowerCase().trim();
                const catPath = (t.category_path || '').toLowerCase().trim();

                return subName === subLow ||
                    directCat === subLow ||
                    catPath.includes(subLow);
            });
        }

        if (selectedChildCategoryFilter && selectedChildCategoryFilter !== 'all') {
            const childLow = selectedChildCategoryFilter.toLowerCase().trim();
            result = result.filter(t => {
                const childName = (t.child_category_name || '').toLowerCase().trim();
                const directCat = (t.category || '').toLowerCase().trim();
                const catPath = (t.category_path || '').toLowerCase().trim();

                return childName === childLow ||
                    directCat === childLow ||
                    catPath.includes(childLow);
            });
        }

        // Backward compatibility for selectedDeptFilter
        if (selectedDeptFilter && selectedDeptFilter !== 'all' && (!selectedCategoryFilter || selectedCategoryFilter === 'all')) {
            const filterLow = selectedDeptFilter.toLowerCase();
            result = result.filter(t =>
                t.category === selectedDeptFilter ||
                (t.category_path && t.category_path.toLowerCase().includes(filterLow)) ||
                (t.category && t.category.toLowerCase().includes(filterLow))
            );
        }

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                (t.title || '').toLowerCase().includes(term) ||
                (t.description || '').toLowerCase().includes(term) ||
                (t.category || '').toLowerCase().includes(term) ||
                (t.main_category_name || '').toLowerCase().includes(term) ||
                (t.sub_category_name || '').toLowerCase().includes(term) ||
                (t.child_category_name || '').toLowerCase().includes(term) ||
                (t.category_path || '').toLowerCase().includes(term) ||
                (t.assigned_to_name || '').toLowerCase().includes(term)
            );
        }

        return result;
    }, [tasks, dateFilter, customDateRange, selectedStaffFilter, selectedDeptFilter, selectedCategoryFilter, selectedSubcategoryFilter, selectedChildCategoryFilter, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: filteredTasks.length,
            todo: filteredTasks.filter(t => t.status === 'To-Do').length,
            completed: filteredTasks.filter(t => t.status === 'Completed').length,
            rejected: filteredTasks.filter(t => t.status === 'Rejected').length,
        };
    }, [filteredTasks]);

    const renderColumns = useMemo(() => {
        if (groupBy === 'status') {
            return {
                'Unassigned': filteredTasks.filter(t => t.status === 'Unassigned'),
                'To-Do': filteredTasks.filter(t => t.status === 'To-Do'),
                'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
                'In Review': filteredTasks.filter(t => t.status === 'In Review'),
                'Rejected': filteredTasks.filter(t => t.status === 'Rejected'),
                'Completed': filteredTasks.filter(t => t.status === 'Completed'),
            };
        } else {
            const cols = {};

            let activeStaff = staff;
            if (selectedStaffFilter !== 'all') {
                if (selectedStaffFilter === 'unassigned') {
                    activeStaff = [];
                } else {
                    activeStaff = staff.filter(s => s.name === selectedStaffFilter);
                }
            }

            activeStaff.forEach(s => {
                cols[s.name] = filteredTasks.filter(t => t.assigned_to_name === s.name);
            });

            const unassigned = filteredTasks.filter(t => !t.assigned_to);
            if ((selectedStaffFilter === 'all' || selectedStaffFilter === 'unassigned') && (unassigned.length > 0 || staff.length === 0)) {
                cols['Unassigned'] = unassigned;
            }
            return cols;
        }
    }, [filteredTasks, groupBy, staff, selectedStaffFilter]);

    const getColStyle = (colName) => {
        if (groupBy === 'status') {
            const styles = {
                'Unassigned': { bg: 'bg-slate-100/80', border: 'border-slate-300 border-dashed', text: 'text-slate-600', dot: 'bg-slate-400' },
                'To-Do': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
                'In Progress': { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-800', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' },
                'In Review': { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
                'Rejected': { bg: 'bg-red-50/50', border: 'border-red-100', text: 'text-red-800', dot: 'bg-red-500' },
                'Completed': { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
            };
            return styles[colName] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' };
        } else {
            return { bg: 'bg-indigo-50/30', border: 'border-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-400' };
        }
    };

    const handleRejectClick = (task) => {
        setRejectTask(task);
        setRejectReason('');
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection.');
            return;
        }
        const currentReject = rejectTask;
        const prevTasks = [...tasks];

        // Optimistic UI update
        setTasks(prev => prev.map(t => (t.id === currentReject.id ? { ...t, status: 'Rejected' } : t)));
        setRejectTask(null);
        toast.success('Task marked as Rejected');
        setActionLoading(true);

        try {
            const res = await axios.post(`${apiBase}api/admin/tasks/update_task_status.php`, {
                task_id: currentReject.id,
                status: 'Rejected',
                admin_note: rejectReason,
                changed_by: currentUser?.id ?? null,
            });
            if (res.data.status === 'success') {
                fetchTasksAndStaff(true);
            } else {
                setTasks(prevTasks);
                toast.error(res.data.message || 'Failed to reject task.');
            }
        } catch {
            setTasks(prevTasks);
            toast.error('Failed to reject task.');
        } finally {
            setActionLoading(false);
        }
    };

    return { handleDeleteComment, handleAddComment, fetchComments, fetchTaskHistory, handleSaveEdit, joditConfig, fetchTasksAndStaff, handleCreateTask, openEditModal, handleEditTask, handleDeleteTask, handleDuplicateTask, handleStatusChange, filteredTasks, stats, renderColumns, getColStyle, handleRejectClick, submitReject };
};
