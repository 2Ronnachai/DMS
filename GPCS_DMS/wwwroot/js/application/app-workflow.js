class AppWorkflow {
    constructor(appMain, applicationData = null) {
        this.appMain = appMain;
        this.data = applicationData;
        this.container = document.getElementById('workflowSection');

        this.currentUserNid = 'p3695';
    }

    render() {
        if (!this.data || !this.data.steps) {
            this.container.innerHTML =
                '<span class="text-muted">No workflow data available.</span>';
            return;
        }

        this.container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <span class="header-application-type">
                                <i class="fas fa-route me-2 text-muted"></i>
                                    Workflow Progress
                            </span>
                        </div>
                        <div class="workflow-summary text-end">
                            ${this._renderSummary()}
                        </div>
                    </div>
                    <div class="workflow-steps">
                        ${this._renderSteps()}
                    </div>
                </div>
            </div>
        `;
        this._bindCommentToggle();
    }

    _renderSummary() {
        const {
            currentStepSequence,
            totalSteps,
            applicationStatus
        } = this.data;
        const progressPercent = totalSteps > 0
            ? Math.round((currentStepSequence / totalSteps) * 100)
            : 0;

        let progressClass = 'bg-secondary';

        if (['Rejected', 'Cancelled'].includes(applicationStatus)) {
            progressClass = 'bg-danger';
        }
        else if (progressPercent === 100) {
            progressClass = 'bg-success';
        }

        return `
            <div class="d-flex align-items-center gap-3">
                <div class="text-muted small">
                    Step ${currentStepSequence} / ${totalSteps}
                </div>
                <div style="width:140px;">
                    <div class="progress" style="height:6px;">
                        <div class="progress-bar ${progressClass}"
                            style="width:${progressPercent}%">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderSteps() {
        return this.data.steps
            .sort((a, b) => a.sequenceNo - b.sequenceNo)
            .map(step => this._renderStep(step))
            .join('');
    }

    _renderStep(step) {
        const isCurrent = step.isCurrentStep;
        const isCompleted = !!step.completedAt;
        const isUpcoming = !isCurrent && !isCompleted;

        const hasRejectedAction = step.assignees?.some(a =>
            a.actionTaken === 'Return' || a.actionTaken === 'Cancel'
        );

        const stepClass = isCurrent
            ? 'workflow-step current'
            : isCompleted
                ? 'workflow-step completed'
                : 'workflow-step upcoming';

        const dotClass = hasRejectedAction
            ? 'dot-rejected'
            : isCurrent
                ? 'dot-current'
                : isCompleted
                    ? 'dot-completed'
                    : 'dot-upcoming';

        return `
            <div class="${stepClass}">
                
                <div class="timeline">
                    <span class="dot ${dotClass}"></span>
                    ${!step.isFinalStep ? '<span class="line"></span>' : ''}
                </div>

                <div class="step-content">
                    <div class="step-header">
                        <span class="step-name">${step.stepName}</span>
                        ${isCurrent ? '<span class="badge bg-primary ms-2">Current</span>' : ''}
                        ${step.isFinalStep ? '<span class="badge bg-light text-muted ms-2">Final</span>' : ''}
                    </div>

                    <div class="assignee-list">
                        ${this._renderAssignees(step.assignees)}
                    </div>
                </div>

            </div>
        `;
    }

    _renderAssignees(assignees) {
        if (!assignees || assignees.length === 0) {
            return `<div class="text-muted small fst-italic">— No assignee —</div>`;
        }

        return assignees.map(a => this._renderAssignee(a)).join('');
    }

    _renderAssignee(a) {
        const isMe = a.nId === this.currentUserNid;
        const isActioned = a.hasActioned;
        const action = isActioned
            ? this._getActionDisplay(a.actionTaken)
            : {
                text: 'Waiting',
                icon: 'fa-clock',
                class: 'text-muted'
            };

        const actionTime = a.actionedAt
            ? `<small class="text-muted ms-2">
                ${new Date(a.actionedAt).toLocaleString()}
            </small>`
            : '';

        const hasComment = !!a.comments;
        const commentId = `comment-${a.assignmentId}-${a.nId}`;


        return `
            <div class="assignee-item ${isMe ? 'me' : ''} ${isActioned ? 'actioned' : ''}">
                <i class="fas ${action.icon} ${action.class} me-2"></i>

                <span class="assignee-name">
                    ${a.employeeName}
                </span>

                <span class="assignee-action ms-2 ${action.class}">
                    ${action.text}
                </span>

                ${actionTime}
                ${hasComment ? `
                    <i class="far fa-comment-dots text-muted ms-2 comment-toggle"
                       title="View comment"
                       data-target="${commentId}">
                    </i>
                ` : ''}
            </div>
            ${hasComment ? `
                <div id="${commentId}" class="assignee-comment d-none">
                    “${a.comments}”
                </div>
            ` : ''}
        `;
    }

    _bindCommentToggle() {
        this.container.addEventListener('click', (e) => {
            const icon = e.target.closest('.comment-toggle');
            if (!icon) return;

            const targetId = icon.dataset.target;
            const commentEl = document.getElementById(targetId);

            if (!commentEl) return;

            commentEl.classList.toggle('d-none');
            icon.classList.toggle('active');
        });
    }

    _getActionDisplay(actionType) {
        const map = {
            Prepare: {
                text: 'Prepared',
                icon: 'fa-pen',
                class: 'text-muted'
            },
            Submit: {
                text: 'Submitted',
                icon: 'fa-paper-plane',
                class: 'text-primary'
            },
            Approve: {
                text: 'Approved',
                icon: 'fa-check-circle',
                class: 'text-success'
            },
            Return: {
                text: 'Returned',
                icon: 'fa-rotate-left',
                class: 'text-warning'
            },
            Cancel: {
                text: 'Cancelled',
                icon: 'fa-ban',
                class: 'text-danger'
            }
        };

        return map[actionType] || {
            text: actionType || 'Waiting',
            icon: 'fa-clock',
            class: 'text-muted'
        };
    }

    _formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const format = this.appMain.getDateFormat();

        // Simple formatting - you can use your existing date formatter
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    update(data) {
        this.data = data;
        this.render();
    }

    clear() {
        this.data = null;
        this.container.innerHTML = '';
    }
}
