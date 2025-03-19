d3.csv("data_ggsheet.csv").then(function(data) {
    try {

        data = data.filter(d => {
            try {
                const date = new Date(d["Thời gian tạo đơn"]);
                if (isNaN(date.getTime())) return false;

                if (!d["Mã đơn hàng"] || !d["Mã nhóm hàng"] || !d["Tên nhóm hàng"] ||
                    !d["Mã mặt hàng"] || !d["Tên mặt hàng"]) return false;

                d["Tháng"] = "T" + (date.getMonth() + 1).toString().padStart(2, '0');
                d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
                d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
                return true;
            } catch (e) {
                console.error("Lỗi xử lý dữ liệu:", e, d);
                return false;
            }
        });

        const dataByGroup = d3.group(data, d => d["Nhóm hàng"]);

        const nhomHangList = Array.from(dataByGroup.keys()).slice(0, 5);

        const mainContainer = d3.select("#charts")
            .style("display", "grid")
            .style("grid-template-columns", "repeat(3, 1fr)")
            .style("grid-template-rows", "repeat(2, auto)") 
            .style("gap", "10px")
            .style("max-width", "1000px")
            .style("margin", "auto");

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", 1000);
        
        nhomHangList.forEach(nhom => {
            const filteredData = dataByGroup.get(nhom);

            const countByItemMonth = Array.from(
                d3.rollup(
                    filteredData,
                    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
                    d => d["Tháng"],
                    d => d["Mặt hàng"]
                ),
                ([month, items]) => Array.from(items, ([item, count]) => ({ month, item, count }))
            ).flat();

            const totalOrdersByMonth = new Map(
                d3.rollup(
                    filteredData,
                    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
                    d => d["Tháng"]
                )
            );

            const probabilities = countByItemMonth.map(d => {
                const total = totalOrdersByMonth.get(d.month) || 0;
                return {
                    month: d.month,
                    item: d.item,
                    count: d.count,
                    probability: total > 0 ? d.count / total : 0
                };
            });
            
            const topItems = [...new Set(probabilities.map(d => d.item))]
                .map(item => {
                    const itemData = probabilities.filter(d => d.item === item);
                    const avgProb = d3.mean(itemData, d => d.probability);
                    return { item, avgProb };
                })
                .sort((a, b) => b.avgProb - a.avgProb)
                .slice(0, 5)
                .map(d => d.item);
            
            const filteredProbabilities = probabilities.filter(d => topItems.includes(d.item));
            
            const container = mainContainer.append("div")
                .attr("class", "chart-container")
                .style("border", "1px solid #ddd")
                .style("padding", "15px")
                .style("border-radius", "8px")
                .style("background", "#f9f9f9")
                .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");
            
            drawLineChart(container, filteredProbabilities, nhom, tooltip);
        });

    } catch (error) {
        console.error("Lỗi khi xử lý dữ liệu:", error);
        d3.select("#charts").append("div")
            .attr("class", "error-message")
            .style("color", "red")
            .style("padding", "20px")
            .text("Đã xảy ra lỗi khi xử lý dữ liệu: " + error.message);
    }
}).catch(error => {
    console.error("Lỗi khi tải dữ liệu:", error);
    d3.select("#charts").append("div")
        .attr("class", "error-message")
        .style("color", "red")
        .style("padding", "20px")
        .text("Không thể tải dữ liệu từ file CSV: " + error.message);
});

function drawLineChart(container, data, title, tooltip) {
    
    const width = 450, height = 250;
    const margin = { top: 30, right: 20, bottom: 20, left: 50 };
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const months = [...new Set(data.map(d => d.month))].sort();

    const items = [...new Set(data.map(d => d.item))];
    
    const x = d3.scalePoint()
        .domain(months)
        .range([0, chartWidth])
        .padding(0.5);

    const y = d3.scaleLinear()
        .domain([0, Math.max(d3.max(data, d => d.probability) * 1.1, 0.1)]) // Giới hạn trên và dưới
        .nice()
        .range([chartHeight, 0]);
    
    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(items);
    
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");
    
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d => `${(d * 100).toFixed(0)}%`))
        .style("font-size", "10px");

    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.probability))
        .curve(d3.curveMonotoneX);

    function safeId(str) {
        return "item-" + str.replace(/[^\w-]/g, "-");
    }

    items.forEach(item => {
        const itemData = data.filter(d => d.item === item);
        const itemId = safeId(item);

        g.append("path")
            .datum(itemData)
            .attr("fill", "none")
            .attr("stroke", color(item))
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("class", `line-${itemId}`);

        g.selectAll(`.dot-${itemId}`)
            .data(itemData)
            .enter().append("circle")
            .attr("class", `dot-${itemId}`)
            .attr("cx", d => x(d.month))
            .attr("cy", d => y(d.probability))
            .attr("r", 4)
            .attr("fill", color(item))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);

                tooltip.html(`<strong>${d.item}</strong><br>
                             Tháng: ${d.month}<br>
                             Số đơn: ${d.count}<br>
                             Xác suất: ${(d.probability * 100).toFixed(2)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                d3.select(this)
                    .attr("r", 6)
                    .style("stroke", "#fff")
                    .style("stroke-width", 2);
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                d3.select(this)
                    .attr("r", 4)
                    .style("stroke", "none");
            });
    });
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(title);
}