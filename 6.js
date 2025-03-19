d3.csv("data_ggsheet (1).csv").then(function(data) {
    data.forEach(d => {
        d.Thanh_tien = +d.Thanh_tien;
        const date = new Date(d.Thoi_gian_tao_don);

        const hour = String(date.getHours()).padStart(2, '0');
        d.Khung_gio = `${hour}.00-${hour}.59`;

        d.Ngay = date.toISOString().split("T")[0]; 
    });

    // Nhóm dữ liệu theo khung giờ
    const groupedData = d3.rollups(
        data,
        v => {
            const totalRevenue = d3.sum(v, d => d.Thanh_tien); 
            const uniqueDays = new Set(v.map(d => d.Ngay)).size; 
            return totalRevenue / uniqueDays; 
        },
        d => d.Khung_gio
    ).map(([Khung_gio, Thanh_tien]) => ({ Khung_gio, Thanh_tien }));

    groupedData.sort((a, b) => parseInt(a.Khung_gio) - parseInt(b.Khung_gio));

    const colorScale = d3.scaleOrdinal()
        .domain(groupedData.map(d => d.Khung_gio))
        .range(d3.schemeTableau10);

    drawChart(groupedData, colorScale);
});

function drawChart(data, colorScale) {
    const width = 1000, height = 600;
    const margin = { top: 60, right: 50, bottom: 120, left: 100 };
    d3.select("svg").selectAll("*").remove();

    const svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleBand()
                .domain(data.map(d => d.Khung_gio))
                .range([margin.left, width - margin.right])
                .padding(0.3);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.Thanh_tien)])
                .nice()
                .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .tickSize(0)
            .tickPadding(10)
        )
        .selectAll("text")
        .attr("transform", "rotate(-45)") // Xoay chữ để dễ đọc
        .style("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d => d / 1e6 + " M")
        );

    const tooltip = d3.select("body").append("div")
                      .attr("class", "tooltip")
                      .style("position", "absolute")
                      .style("background", "white")
                      .style("padding", "8px")
                      .style("border", "1px solid #ccc")
                      .style("border-radius", "4px")
                      .style("visibility", "hidden");

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Khung_gio))
        .attr("y", d => y(d.Thanh_tien))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.Thanh_tien))
        .attr("fill", d => colorScale(d.Khung_gio))
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
            .html(`<strong>Khung giờ ${d.Khung_gio}</strong><br>
                <strong>Doanh số TB:</strong> ${d.Thanh_tien.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            d3.select(this).style("opacity", 0.7);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            d3.select(this).style("opacity", 1);
        });

    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.Khung_gio) + x.bandwidth() / 2)
        .attr("y", d => y(d.Thanh_tien) + 15)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "white")
        .text(d => (d.Thanh_tien / 1e3).toFixed(1) + "K");

    svg.append("text")
       .attr("class", "title")
       .attr("x", width / 2)
       .attr("y", 30)
       .text("Doanh số bán hàng trung bình theo Khung giờ")
       .style("fill", "black")
       .style("text-anchor", "middle");
}
