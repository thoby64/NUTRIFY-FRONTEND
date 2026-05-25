window.WorkspacePlanningReport = (() => {
    function escape(value) {
        return WorkspaceCore.escapeHtml(value);
    }

    function formatValue(item) {
        const value = Number(item?.value || 0);
        const unit = item?.unit ? ` ${item.unit}` : '';
        return `${value.toFixed(1)}${unit}`;
    }

    function renderHighlights(highlights, emptyText = 'No nutrient totals yet.') {
        if (!highlights || highlights.length === 0) {
            return `<div class="workspace-empty">${escape(emptyText)}</div>`;
        }

        return `
            <div class="planning-highlight-grid">
                ${highlights.map((item) => `
                    <div class="planning-highlight">
                        <span>${escape(item.label || item.code)}</span>
                        <strong>${escape(formatValue(item))}</strong>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildPlanReportHtml(report) {
        const days = report.days || [];

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${escape(report.title || 'Nutrition Plan')}</title>
                <style>
                    body { font-family: Manrope, Arial, sans-serif; margin: 32px; color: #112118; background: #f8faf8; }
                    .sheet { max-width: 1040px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; box-shadow: 0 24px 80px rgba(17,33,24,.08); }
                    .hero { padding: 28px; border-radius: 20px; color: #ffffff; background: linear-gradient(135deg, #157347 0%, #0f766e 55%, #d97706 100%); }
                    h1, h2, h3 { margin: 0; }
                    .meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
                    .meta-card { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.2); border-radius: 16px; padding: 14px; }
                    .meta-card span { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; opacity: .82; margin-bottom: 8px; }
                    .grid { display: grid; gap: 20px; }
                    .section { margin-top: 24px; }
                    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
                    .summary-card { border-radius: 16px; border: 1px solid rgba(17,33,24,.08); background: #f9fcf8; padding: 16px; }
                    .summary-card span { display: block; color: #526059; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
                    .summary-card strong { display: block; margin-top: 8px; font-size: 20px; }
                    .day-card { border: 1px solid rgba(17,33,24,.08); border-radius: 20px; padding: 24px; background: #ffffff; }
                    .meal-card { margin-top: 18px; border-radius: 18px; background: #f4f7f1; padding: 18px; }
                    .meal-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
                    .food-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
                    .food-table th, .food-table td { text-align: left; padding: 10px 0; border-bottom: 1px solid rgba(17,33,24,.08); vertical-align: top; }
                    .food-table th { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #526059; }
                    .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(21,115,71,.1); color: #0f5f3c; font-size: 12px; font-weight: 700; }
                    .notes { margin-top: 10px; color: #526059; }
                    @media print { body { margin: 0; background: #ffffff; } .sheet { box-shadow: none; padding: 0; } }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="hero">
                        <h1>${escape(report.title || 'Nutrition Plan')}</h1>
                        <p>${escape(report.client_display_label || 'Anonymous planning reference')} ${report.client_code ? `(${escape(report.client_code)})` : ''}</p>
                        <div class="meta">
                            <div class="meta-card">
                                <span>Status</span>
                                <strong>${escape(report.status || 'draft')}</strong>
                            </div>
                            <div class="meta-card">
                                <span>Plan type</span>
                                <strong>${escape(report.plan_type || 'multi_day')}</strong>
                            </div>
                            <div class="meta-card">
                                <span>Start date</span>
                                <strong>${escape(report.start_date || 'Not set')}</strong>
                            </div>
                            <div class="meta-card">
                                <span>Days</span>
                                <strong>${escape(String(report.days_count || days.length || 0))}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="section">
                        <h2>Plan Summary</h2>
                        <div class="summary">
                            ${(report.summary?.highlights || []).map((item) => `
                                <div class="summary-card">
                                    <span>${escape(item.label || item.code)}</span>
                                    <strong>${escape(formatValue(item))}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="grid section">
                        ${days.map((day) => `
                            <div class="day-card">
                                <div class="meal-head">
                                    <div>
                                        <h2>Day ${escape(String(day.day_index))}: ${escape(day.day_name || '')}</h2>
                                        <div class="notes">${escape(day.actual_date || 'No date assigned')}</div>
                                    </div>
                                    <span class="pill">${escape(String(day.summary?.foods_count || 0))} foods</span>
                                </div>
                                <div class="summary">
                                    ${(day.summary?.highlights || []).map((item) => `
                                        <div class="summary-card">
                                            <span>${escape(item.label || item.code)}</span>
                                            <strong>${escape(formatValue(item))}</strong>
                                        </div>
                                    `).join('')}
                                </div>
                                ${(day.meals || []).map((meal) => `
                                    <div class="meal-card">
                                        <div class="meal-head">
                                            <div>
                                                <h3>${escape(meal.meal_name || 'Meal')}</h3>
                                                <div class="notes">${escape(meal.meal_time || meal.meal_type || 'Schedule not set')}</div>
                                            </div>
                                            <span class="pill">${escape(String(meal.summary?.foods_count || 0))} foods</span>
                                        </div>
                                        ${(meal.instructions || meal.target_notes) ? `
                                            <div class="notes">
                                                ${meal.instructions ? `<div><strong>Instructions:</strong> ${escape(meal.instructions)}</div>` : ''}
                                                ${meal.target_notes ? `<div><strong>Target notes:</strong> ${escape(meal.target_notes)}</div>` : ''}
                                            </div>
                                        ` : ''}
                                        <table class="food-table">
                                            <thead>
                                                <tr>
                                                    <th>Food</th>
                                                    <th>Portion</th>
                                                    <th>Energy</th>
                                                    <th>Protein</th>
                                                    <th>Carbs</th>
                                                    <th>Fat</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${(meal.foods || []).map((food) => `
                                                    <tr>
                                                        <td>
                                                            <strong>${escape(food.food_name || '')}</strong>
                                                            <div class="notes">${escape(food.food_group_name || '')}</div>
                                                        </td>
                                                        <td>${escape(String(food.portion_grams || 0))} g${food.portion_description ? `<div class="notes">${escape(food.portion_description)}</div>` : ''}</td>
                                                        <td>${escape(formatValue({ value: food.calculated_nutrients?.ENERGY_KC || 0, unit: 'kcal' }))}</td>
                                                        <td>${escape(formatValue({ value: food.calculated_nutrients?.PROCNT || 0, unit: 'g' }))}</td>
                                                        <td>${escape(formatValue({ value: food.calculated_nutrients?.CHOCDF || 0, unit: 'g' }))}</td>
                                                        <td>${escape(formatValue({ value: food.calculated_nutrients?.FAT || 0, unit: 'g' }))}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async function downloadReport(report) {
        const slug = (report.title || 'nutrition-plan')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'nutrition-plan';

        if (typeof window.html2pdf !== 'function') {
            throw new Error('PDF export library is not available on this page.');
        }

        const sandbox = document.createElement('div');
        sandbox.className = 'planning-pdf-export-root';
        sandbox.style.position = 'fixed';
        sandbox.style.left = '-100000px';
        sandbox.style.top = '0';
        sandbox.style.width = '1100px';
        sandbox.style.pointerEvents = 'none';
        sandbox.innerHTML = buildPlanReportHtml(report);
        document.body.appendChild(sandbox);

        const source = sandbox.querySelector('.sheet') || sandbox;

        try {
            await window.html2pdf()
                .set({
                    margin: [8, 8, 8, 8],
                    filename: `${slug}-report.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait',
                    },
                    pagebreak: {
                        mode: ['css', 'legacy'],
                    },
                })
                .from(source)
                .save();
        } finally {
            sandbox.remove();
        }
    }

    return {
        buildPlanReportHtml,
        downloadReport,
        formatValue,
        renderHighlights,
    };
})();
