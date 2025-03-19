d3.csv("data_ggsheet (1).csv").then(function(data) {
    const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    data.forEach(d => {
        d.Thanh_tien = +d.Thanh_tien;
        const date = new Date(d.Thoi_gian_tao_don);
        d.Ngay_Trong_Tuan = weekdays[date.getDay()];
        d.Ngay = date.toISOString().split("T")[0]; 
    });

    const groupedData = d3.rollups(
        data,
        v => {
            const totalRevenue = d3.sum(v, d => d.Thanh_tien); 
            const uniqueDays = new Set(v.map(d => d.Ngay)).size; 
            return totalRevenue / uniqueDays;
        },
        d => d.Ngay_Trong_Tuan
    ).map(([Ngay_Trong_Tuan, Thanh_tien]) => ({ Ngay_Trong_Tuan, Thanh_tien }));

    const weekdayOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
    groupedData.sort((a, b) => weekdayOrder.indexOf(a.Ngay_Trong_Tuan) - weekdayOrder.indexOf(b.Ngay_Trong_Tuan));

    const colorScale = d3.scaleOrdinal()
        .domain(groupedData.map(d => d.Ngay_Trong_Tuan))
        .range(d3.schemeTableau10);

    drawChart(groupedData, colorScale);
});

function drawChart(data, colorScale) {
    const width = 800, height = 600;
    const margin = { top: 60, right: 50, bottom: 100, left: 100 };
    d3.select("svg").selectAll("*").remove(); // Xóa nội dung cũ

    const svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleBand()
                .domain(data.map(d => d.Ngay_Trong_Tuan))
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
        .call(d3.axisLeft(y)
            .ticks(Math.ceil(d3.max(data, d => d.Thanh_tien) / 5e6)) // Đảm bảo tick cách nhau 5M
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
        .attr("x", d => x(d.Ngay_Trong_Tuan))
        .attr("y", d => y(d.Thanh_tien))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.Thanh_tien))
        .attr("fill", d => colorScale(d.Ngay_Trong_Tuan))
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                   .html(`<strong>${d.Ngay_Trong_Tuan}</strong><br><strong>Doanh số TB:</strong> ${d.Thanh_tien.toLocaleString()} VND`);
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
        .attr("x", d => x(d.Ngay_Trong_Tuan) + x.bandwidth() / 2)
        .attr("y", d => y(d.Thanh_tien) + 20)
        .style("text-anchor", "middle")
        .style("font-size", "8px")
        .style("fill", "white")
        .text(d => Math.round(d.Thanh_tien).toLocaleString() + " VND");

    svg.append("text")
       .attr("class", "title")
       .attr("x", width / 2)
       .attr("y", 30)
       .text("Doanh số trung bình theo Ngày trong tuần")
       .style("fill", "black");
}