d3.csv("data_ggsheet (1).csv").then(function(data) {
    data.forEach(d => {
        d.Ma_KH = d.Ma_KH;
        d.Thanh_tien = d.Thanh_tien;
    });

    const customerSpending = d3.rollups(
        data,
        v => d3.sum(v, d => d.Thanh_tien),
        d => d.Ma_KH
    ).map(([Ma_KH, Total_Spent]) => ({ Ma_KH, Total_Spent }));

    drawHistogram("#chart", customerSpending);
});

function drawHistogram(container, data) {
    const width = 1000, height = 500;
    const margin = { top: 60, right: 200, bottom: 50, left: 100 };

    const minSpent = d3.min(data, d => d.Total_Spent);
    const maxSpent = d3.max(data, d => d.Total_Spent);

    const binSize = 50000;

    let histogramData = [];
    for (let i = Math.floor(minSpent / binSize) * binSize; i <= maxSpent; i += binSize) {
        const customersInBin = data.filter(d => d.Total_Spent >= i && d.Total_Spent < i + binSize).length;
        histogramData.push({
            binStart: i,
            binEnd: i + binSize,
            quantity: customersInBin
        });
    }

    const x = d3.scaleLinear()
        .domain([0, maxSpent])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(histogramData, d => d.quantity)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const tooltip = d3.select(container)
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("font-size", "14px");

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat("").ticks(10)); 

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(Math.ceil(y.domain()[1] / 500)).tickFormat(d3.format("d")));

    svg.selectAll("rect")
        .data(histogramData)
        .enter().append("rect")
        .attr("x", d => x(d.binStart))
        .attr("y", d => y(d.quantity))
        .attr("width", d => Math.max(0, x(d.binEnd) - x(d.binStart) - 2))
        .attr("height", d => height - margin.bottom - y(d.quantity))
        .attr("fill", "#33CCCC")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Mức chi trả:</strong> Từ ${d3.format(",")(d.binStart)} đến ${d3.format(",")(d.binEnd)}<br>
                    <strong>Số lượng KH:</strong> ${d3.format(",")(d.quantity)}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            d3.select(event.currentTarget).attr("fill", "#FFFF66"); 
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(event) {
            tooltip.style("visibility", "hidden");
            d3.select(event.currentTarget).attr("fill", "#33CCCC"); 
        });        

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .style("text-anchor", "middle")
        .style("fill", "#33CCCC")
        .text("Phân phối Mức Chi trả của Khách Hàng");
}
