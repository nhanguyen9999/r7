d3.csv("data_ggsheet (1).csv").then(function(data) {
    data.forEach(d => {
        d.Nhom_hang = `[${d.Ma_nhom_hang}] ${d.Ten_nhom_hang}`;
    });

    const totalOrders = new Set(data.map(d => d.Ma_don_hang)).size;

    const groupedData = d3.rollups(
        data,
        v => new Set(v.map(d => d.Ma_don_hang)).size,
        d => d.Nhom_hang
    ).map(([Nhom_hang, So_don_hang]) => ({
        Nhom_hang,
        Xac_suat: So_don_hang / totalOrders 
    }));

    groupedData.sort((a, b) => b.Xac_suat - a.Xac_suat);

    const uniqueGroups = groupedData.map(d => d.Nhom_hang);
    const colorScale = d3.scaleOrdinal()
        .domain(uniqueGroups)
        .range(d3.schemeTableau10);

    drawChart(groupedData, colorScale);
});

function drawChart(data, colorScale) {
    const width = 1200, height = 600;
    const margin = { top: 60, right: 250, bottom: 50, left: 250 };
    d3.select("svg").selectAll("*").remove();

    const svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.Xac_suat)])
                .nice()
                .range([margin.left, width - margin.right - 100]);

    const y = d3.scaleBand()
                .domain(data.map(d => d.Nhom_hang))
                .range([margin.top, height - margin.bottom])
                .padding(0.3);

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .ticks(6)
            .tickFormat(d => (d * 100).toFixed(0) + "%"));

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", margin.left)
        .attr("y", d => y(d.Nhom_hang))
        .attr("width", d => x(d.Xac_suat) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.Nhom_hang));

    svg.selectAll(".label")
       .data(data)
       .enter()
       .append("text")
       .attr("class", "label")
       .attr("x", d => x(d.Xac_suat) - 5)
       .attr("y", d => y(d.Nhom_hang) + y.bandwidth() / 2)
       .attr("dy", "0.35em")
       .style("text-anchor", "end")
       .text(d => (d.Xac_suat * 100).toFixed(1) + "%");

    // Tiêu đề biểu đồ
    svg.append("text")
       .attr("class", "title")
       .attr("x", width / 2)
       .attr("y", 30)
       .style("text-anchor", "middle")
       .text("Xác suất bán hàng theo Nhóm hàng");

    // Vẽ chú thích (Legend)
    drawLegend(svg, colorScale, data.map(d => d.Nhom_hang), width - 180, margin.top);
}

function drawLegend(svg, colorScale, uniqueGroups, legendX, legendY) {
    const legendSpacing = 25;
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
