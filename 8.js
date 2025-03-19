d3.csv("data_ggsheet (1).csv").then(function(data) {
    data.forEach(d => {
        d.Nhom_hang = `[${d.Ma_nhom_hang}] ${d.Ten_nhom_hang}`;
        d.Thang = new Date(d.Thoi_gian_tao_don).getMonth() + 1;
    });

    const totalOrdersPerMonth = d3.rollups(
        data,
        v => new Set(v.map(d => d.Ma_don_hang)).size,
        d => d.Thang
    );

    const totalOrdersMap = new Map(totalOrdersPerMonth);

    const groupedData = d3.rollups(
        data,
        v => ({
            So_don_hang: new Set(v.map(d => d.Ma_don_hang)).size,
            Xac_suat: new Set(v.map(d => d.Ma_don_hang)).size / totalOrdersMap.get(v[0].Thang)
        }),
        d => d.Thang,
        d => d.Nhom_hang
    );

    let processedData = [];
    groupedData.forEach(([thang, nhomData]) => {
        nhomData.forEach(([nhom_hang, { Xac_suat }]) => {
            processedData.push({ Thang: thang, Nhom_hang: nhom_hang, Xac_suat });
        });
    });

    const uniqueGroups = [...new Set(processedData.map(d => d.Nhom_hang))];
    const colorScale = d3.scaleOrdinal()
        .domain(uniqueGroups)
        .range(d3.schemeTableau10);

    drawLineChart(processedData, colorScale);
});

function drawLineChart(data, colorScale) {
    const width = 1000, height = 500;
    const margin = { top: 60, right: 200, bottom: 50, left: 100 };
    d3.select("svg").selectAll("*").remove();

    const svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleLinear()
                .domain([1, 12])
                .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
                .domain([d3.min(data, d => d.Xac_suat), d3.max(data, d => d.Xac_suat)])
                .nice()
                .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => `Tháng ${String(d).padStart(2, '0')}`));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .tickValues([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) 
            .tickFormat(d => (d * 100).toFixed(0) + "%"));

    const nestedData = d3.groups(data, d => d.Nhom_hang);

    const line = d3.line()
        .x(d => x(d.Thang))
        .y(d => y(d.Xac_suat));

    nestedData.forEach(([nhom_hang, values]) => {
        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", colorScale(nhom_hang))
            .attr("stroke-width", 2)
            .attr("d", line);

        svg.selectAll(".dot")
            .data(values)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.Thang))
            .attr("cy", d => y(d.Xac_suat))
            .attr("r", 4)
            .attr("fill", colorScale(nhom_hang));
    });

    svg.append("text")
       .attr("class", "title")
       .attr("x", width / 2)
       .attr("y", 30)
       .text("Doanh số bán hàng của Nhóm hàng theo Tháng")
       .style("fill", "black")
       .style("text-anchor", "middle");

    drawLegend(svg, colorScale, [...new Set(data.map(d => d.Nhom_hang))], width - 180, margin.top);
}

function drawLegend(svg, colorScale, uniqueGroups, legendX, legendY) {
    const legendSpacing = 20;
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

    legend.selectAll(".legend-item")
        .data(uniqueGroups)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * legendSpacing})`)
        .each(function(d) {
            d3.select(this).append("circle")
                .attr("r", 6)
                .attr("cx", 10)
                .attr("cy", 10)
                .attr("fill", colorScale(d));

            d3.select(this).append("text")
                .attr("x", 20)
                .attr("y", 14)
                .text(d.length > 20 ? d.slice(0, 20) + "..." : d)
                .style("font-size", "14px")
                .style("fill", "#333");
        });
}
