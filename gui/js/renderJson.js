$(function() {
	options = {
		collapsed: false,
		rootCollapsable: true,
		withQuotes: false,
		withLinks: true,
	}
	jsonText = {
		a: 5,
		b: {
			x: 7,
			y: 8.5,
		},
	}
	function renderJson() {
		console.log("Im alive!")
		$('#json-renderer').jsonViewer("(" + jsonText + ")", options);
	}
	$("#renderBtn").click(renderJson);
	renderJson();
});