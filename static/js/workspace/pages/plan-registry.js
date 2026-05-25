window.WorkspacePlanRegistryPage = (() => {
    function escape(value) {
        return WorkspaceCore.escapeHtml(value);
    }

    function getPlanningPageHref(planId) {
        return `plan-workspace?plan=${planId}`;
    }

    function renderPlanTable(plans) {
        return WorkspaceCore.renderTable([
            { label: 'Title', key: 'title' },
            { label: 'Type', render: (row) => `<span class="workspace-pill soft">${escape(row.plan_type)}</span>` },
            { label: 'Client', render: (row) => escape(row.client_display_label || 'Anonymous') },
            { label: 'Days', render: (row) => escape(String(row.days_count || 0)) },
            { label: 'Versions', render: (row) => escape(String((row.versions || []).length)) },
            { label: 'Status', render: (row) => `<span class="workspace-pill ${row.status === 'finalized' ? '' : 'warning'}">${escape(row.status)}</span>` },
            {
                label: 'Actions',
                render: (row) => `
                    <div class="workspace-inline-actions">
                        <a class="workspace-btn-secondary" href="${getPlanningPageHref(row.id)}">Open</a>
                        <button class="workspace-btn-secondary planning-preview-report" type="button" data-plan-id="${row.id}">Preview</button>
                        <button class="workspace-btn" type="button" data-download-plan-id="${row.id}">Download</button>
                    </div>
                `,
            },
        ], plans, 'No plans created yet.');
    }

    async function renderPlanRegistry(context) {
        const sections = [];

        const v2Plans = await WorkspaceCore.apiJson('/api/v2/planning/plans');
        const planCount = String(v2Plans.total || 0);
        const finalizedCount = String((v2Plans.data || []).filter((plan) => plan.status === 'finalized').length);

        sections.push(`
            <section class="workspace-hero">
                <div>
                    <h3>Plan Registry</h3>
                    <p>Browse active drafts and finalized versions, then preview or download the saved plan report when needed.</p>
                </div>
                ${context.renderStats([
                    { label: 'Plans', value: planCount, caption: 'Multi-day planner records' },
                    { label: 'Finalized', value: finalizedCount, caption: 'Immutable versions available' },
                    { label: 'Role scope', value: context.role === 'nutritionist' ? 'Personal' : 'Team', caption: 'Filtered by access rights' },
                ])}
            </section>
            <article class="workspace-panel">
                <div class="workspace-panel-head">
                    <div>
                        <h3>Plan Registry</h3>
                        <p>Open the plan studio for edits or download a polished PDF report directly from this page.</p>
                    </div>
                </div>
                <div class="workspace-panel-body">
                    ${renderPlanTable(v2Plans.data || [])}
                </div>
            </article>
            <article class="workspace-panel">
                <div class="workspace-panel-head">
                    <div>
                        <h3>Report preview</h3>
                        <p>Preview a saved plan before downloading it for handoff or documentation.</p>
                    </div>
                </div>
                <div class="workspace-panel-body">
                    <div id="planningReportPreview" class="planning-report-preview">
                        <div class="workspace-empty">Choose Preview on a plan above to load the report here.</div>
                    </div>
                </div>
            </article>
        `);

        context.setPageBody(sections.join(''));
        bindRegistryEvents(context);
    }

    function bindRegistryEvents(context) {
        document.querySelectorAll('[data-download-plan-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                const planId = Number(button.dataset.downloadPlanId);
                try {
                    const report = await WorkspaceCore.apiJson(`/api/v2/planning/plans/${planId}/report`);
                    await WorkspacePlanningReport.downloadReport(report);
                    WorkspaceCore.showAlert('Plan report downloaded as PDF.', 'success');
                } catch (error) {
                    WorkspaceCore.showAlert(error.message, 'error');
                }
            });
        });

        document.querySelectorAll('.planning-preview-report').forEach((button) => {
            button.addEventListener('click', async () => {
                const planId = Number(button.dataset.planId);
                const preview = document.getElementById('planningReportPreview');
                if (!preview) return;

                preview.innerHTML = '<div class="workspace-empty">Loading report preview...</div>';

                try {
                    const report = await WorkspaceCore.apiJson(`/api/v2/planning/plans/${planId}/report`);
                    preview.innerHTML = `
                        <div class="planning-preview-head">
                            <div>
                                <h4>${escape(report.title || 'Nutrition Plan')}</h4>
                                <p>${escape(report.client_display_label || 'Anonymous planning reference')}</p>
                            </div>
                            <div class="workspace-inline-actions">
                                <a class="workspace-btn-secondary" href="${getPlanningPageHref(planId)}">Open in studio</a>
                                <button class="workspace-btn" type="button" id="planningInlineDownloadBtn">Download</button>
                            </div>
                        </div>
                        ${WorkspacePlanningReport.renderHighlights(report.summary?.highlights || [], 'No totals available.')}
                        <div class="planning-preview-scroll">
                            <iframe id="planningReportFrame" title="Plan report preview"></iframe>
                        </div>
                    `;

                    const frame = document.getElementById('planningReportFrame');
                    if (frame) {
                        frame.srcdoc = WorkspacePlanningReport.buildPlanReportHtml(report);
                    }

                    document.getElementById('planningInlineDownloadBtn')?.addEventListener('click', () => {
                        WorkspacePlanningReport.downloadReport(report).catch((error) => {
                            WorkspaceCore.showAlert(error.message, 'error');
                        });
                    });
                } catch (error) {
                    preview.innerHTML = '<div class="workspace-empty">Preview failed to load.</div>';
                    WorkspaceCore.showAlert(error.message, 'error');
                }
            });
        });
    }

    return {
        renderPlanRegistry,
    };
})();
