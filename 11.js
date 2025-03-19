d3.csv("data_ggsheet (1).csv").then(function(data) {

    data.forEach(d => {
        d.Ma_don_hang = d.Ma_don_hang;
        d.Ma_KH = d.Ma_KH;
    });

    const customerPurchases = d3.rollups(
        data,
        v => new Set(v.map(d => d.Ma_don_hang)).size,
        d => d.Ma_KH
    ).map(([Ma_KH, count]) => ({ Ma_KH, count }));

    drawHistogram("#chart", customerPurchases);
});

function drawHistogram(container, data, title) {
    const width = 1000, height = 500;
    const margin = { top: 60, right: 200, bottom: 50, left: 100 };
    
    // Tìm giá trị lớn nhất và nhỏ nhất của count
    const minCount = d3.min(data, d => d.count);
    const maxCount = d3.max(data, d => d.count);

    let histogramData = [];
    for (let i = minCount; i <= maxCount; i++) {
        const customersWithCount = data.filter(d => d.count === i).length;
        histogramData.push({
            count: i,
            quantity: customersWithCount
        });
    }

    const x = d3.scaleLinear()
        .domain([minCount - 0.5, maxCount + 0.5]) 
        .range([margin.left, width - margin.right]);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(histogramData, d => d.quantity)])
        .nice()
        .range([height - margin.bottom, margin.top]);
    
    const tooltip = d3.select(container)
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("display", "none")
        .style("pointer-events", "none");

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(x.domain()[1] - x.domain()[0]).tickFormat(d3.format("d")));    

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(Math.ceil(y.domain()[1] / 1000)).tickFormat(d3.format("d")));

    svg.selectAll("rect")
        .data(histogramData)
        .enter().append("rect")
        .attr("x", d => x(d.count - 0.4))
        .attr("y", d => y(d.quantity))
        .attr("width", d => x(d.count + 0.4) - x(d.count - 0.4))
        .attr("height", d => height - margin.bottom - y(d.quantity))
        .attr("fill", "#33CCCC")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .html(`Số lượt mua hàng: <strong>${d.count}</strong><br>Số lượng KH: <strong>${d.quantity.toLocaleString()}</strong>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            d3.select(this).attr("fill", "#FFFF66"); // Đổi màu khi hover
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
            d3.select(this).attr("fill", "#33CCCC"); // Trả lại màu ban đầu
        });

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .style("text-anchor", "middle")
        .style("fill", "#33CCCC")
        .text("Phân phối Lượt mua hàng");
    
}