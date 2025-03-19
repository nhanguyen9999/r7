d3.csv("data_ggsheet (1).csv").then(function(data) {
    data.forEach(d => {
        d.Thanh_tien = +d.Thanh_tien;
        d.Mat_hang = `[${d.Ma_mat_hang}] ${d.Ten_mat_hang}`;
        d.Nhom_hang = `[${d.Ma_nhom_hang}] ${d.Ten_nhom_hang}`;
    });

    // Nhóm doanh số theo mặt hàng
    const groupedData = d3.rollups(
        data,
        v => ({ Thanh_tien: d3.sum(v, d => d.Thanh_tien), Nhom_hang: v[0].Nhom_hang }),
        d => d.Mat_hang
    ).map(([Mat_hang, values]) => ({ Mat_hang, ...values }));

    groupedData.sort((a, b) => b.Thanh_tien - a.Thanh_tien);

    // Lấy danh sách nhóm hàng duy nhất
    const uniqueGroups = [...new Set(groupedData.map(d => d.Nhom_hang))];

    // Tạo thang màu theo nhóm hàng
    const colorScale = d3.scaleOrdinal()
        .domain(uniqueGroups)
        .range(d3.schemeTableau10); // Sử dụng d3.schemeTableau10 để có màu sắc dễ phân biệt

    drawChart(groupedData, colorScale);
});

function drawChart(data, colorScale) {
    const width = 1200, height = 600;
    const margin = { top: 60, right: 250, bottom: 50, left: 250 };

    const svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.Thanh_tien)])
                .nice()
                .range([margin.left, width - margin.right - 100]);

    const y = d3.scaleBand()
                .domain(data.map(d => d.Mat_hang))
                .range([margin.top, height - margin.bottom])
                .padding(0.3);

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    svg.append("g")
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).tickFormat(d => d / 1e6 + " M"));

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", margin.left)
        .attr("y", d => y(d.Mat_hang))
        .attr("width", d => x(d.Thanh_tien) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.Nhom_hang)); // Màu theo nhóm hàng

    svg.selectAll(".label")
       .data(data)
       .enter()
       .append("text")
       .attr("class", "label")
       .attr("x", d => x(d.Thanh_tien) - 5)
       .attr("y", d => y(d.Mat_hang) + y.bandwidth() / 2)
       .attr("dy", "0.35em")
       .text(d => (d.Thanh_tien / 1e6).toFixed(0) + " triệu VND");

    svg.append("text")
       .attr("class", "title")
       .attr("x", width / 2)
       .attr("y", 30)
       .text("Doanh số bán hàng theo Mặt hàng")
       .style("fill", "#33CCCC");

    // Vẽ legend theo nhóm hàng
    drawLegend(svg, colorScale, [...new Set(data.map(d => d.Nhom_hang))], width - 200, margin.top);
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
            d3.select(this).append("rect") // Hình chữ nhật thay cho vòng tròn
                .attr("width", 15)
                .attr("height", 15)
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill", colorScale(d));

            d3.select(this).append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text(d.length > 20 ? d.slice(0, 20) + "..." : d)
                .style("font-size", "14px")
                .style("fill", "#333");
        });
}
