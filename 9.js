
d3.csv("data_ggsheet.csv").then(function(data) {
    data.forEach(d => {
        d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
        d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
    });

    const nhomHangList = [...new Set(data.map(d => d["Nhóm hàng"]))].slice(0, 5);

    const mainContainer = d3.select("#charts")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(3, 1fr)") 
        .style("grid-template-rows", "repeat(2, auto)") 
        .style("gap", "10px")
        .style("max-width", "1000px")
        .style("margin", "auto");

    nhomHangList.forEach((nhom, index) => {
        const filteredData = data.filter(d => d["Nhóm hàng"] === nhom);

        const countByItem = d3.rollups(
            filteredData,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Mặt hàng"]
        ).map(([item, count]) => ({ item, count }));

        const totalOrders = new Set(filteredData.map(d => d["Mã đơn hàng"])).size;

        const probabilities = countByItem.map(d => ({
            item: d.item,
            probability: d.count / totalOrders
        })).sort((a, b) => a.probability - b.probability); 

        const container = mainContainer.append("div")
            .attr("class", "chart-container")
            .style("border", "1px solid #ddd")
            .style("padding", "10px")
            .style("border-radius", "8px")
            .style("background", "#f9f9f9");

        drawBarChart(container, probabilities, nhom);
    });
});

function drawBarChart(container, data, title) {
    const width = 450, height = 250;
    const margin = { top: 30, right: 20, bottom: 50, left: 175 };

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.probability)])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.item))
        .range([height - margin.bottom, margin.top])
        .padding(0.3);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d.item));

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(d => `${(d * 100).toFixed(0)}%`));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    const tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none");

    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", margin.left)
        .attr("y", d => y(d.item))
        .attr("width", d => x(d.probability) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.item)) // Màu sắc theo từng mặt hàng
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .html(`<strong>${d.item}</strong><br>Xác suất: ${(d.probability * 100).toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.probability) - 45)
        .attr("y", d => y(d.item) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("text-anchor", "start") 
        .style("font-size", "12px")
        .style("fill", "white") 
        .text(d => (d.probability * 100).toFixed(1) + "%");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(title);
}