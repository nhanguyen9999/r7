d3.csv("data_ggsheet (1).csv").then(function(data) {
    data.forEach(d => {
        d.Thanh_tien = +d.Thanh_tien;
        d.Thang = "Tháng " + (new Date(d.Thoi_gian_tao_don).getMonth() + 1).toString().padStart(2, '0');
    });

    const groupedData = d3.rollups(
        data,
        v => d3.sum(v, d => d.Thanh_tien),
        d => d.Thang
    ).map(([Thang, Thanh_tien]) => ({ Thang, Thanh_tien }));

    groupedData.sort((a, b) => a.Thang.localeCompare(b.Thang));

    const colorScale = d3.scaleOrdinal()
        .domain(groupedData.map(d => d.Thang))
        .range(d3.schemeTableau10);

    drawChart(groupedData, colorScale);
});

function drawChart(data, colorScale) {
    const width = 800, height = 600;
    const margin = { top: 60, right: 50, bottom: 100, left: 100 };
    d3.select("svg").selectAll("*").remove(); // Xóa toàn bộ nội dung cũ

    const svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleBand()
                .domain(data.map(d => d.Thang))
                .range([margin.left, width - margin.right])
                .padding(0.3);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.Thanh_tien)])
                .nice()
                .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(10));

    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).tickFormat(d => d / 1e6 + " M"));

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
        .attr("x", d => x(d.Thang))
        .attr("y", d => y(d.Thanh_tien))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.Thanh_tien))
        .attr("fill", d => colorScale(d.Thang))
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                   .html(`<strong>Tháng:</strong> ${d.Thang}<br><strong>Doanh số bán:</strong> ${d.Thanh_tien.toLocaleString()} VND`);
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
        .attr("x", d => x(d.Thang) + x.bandwidth() / 2)  // Căn giữa cột theo trục X
        .attr("y", d => y(d.Thanh_tien) - 10)  // Đặt nhãn phía trên cột
        .attr("dy", "+5em")  // Dịch chuyển lên trên một chút để tránh trùng vào cột
        .style("text-anchor", "middle")  // Căn giữa chữ theo chiều ngang
        .style("font-size", "10px")  // Kích thước chữ vừa phải
        .style("fill", "white")  // Màu chữ (có thể đổi tùy theo nền)
        .attr("transform", d => `rotate(-90, ${x(d.Thang) + x.bandwidth() / 2}, ${y(d.Thanh_tien)+40})`) // Xoay 90 độ
        .text(d => (d.Thanh_tien / 1e6).toFixed(0) + " triệu VND");     
    

    svg.append("text")
       .attr("class", "title")
       .attr("x", width / 2)
       .attr("y", 30)
       .text("Doanh số bán hàng theo Tháng")
       .style("fill", "black");
}
