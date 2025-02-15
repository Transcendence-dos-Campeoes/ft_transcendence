const fs = require('fs');
const path = require('path');
const glob = require('glob');

require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '../.env' });

task("print-json-input", "Prints the standard JSON input for the Solidity compiler", async (_, hre) => {
	// Run compile so that build-info files are generated
	await hre.run("compile", { quiet: true });

	// Look for the build-info file in artifacts/build-info folder
	const buildInfoFiles = glob.sync(path.join(__dirname, 'artifacts', 'build-info', '*.json'));
	if (buildInfoFiles.length === 0) {
		console.error("No build info file found. Please compile your project first.");
		return;
	}

	// Read the first build info file and retrieve its input property
	const buildInfo = JSON.parse(fs.readFileSync(buildInfoFiles[0], "utf8"));

	// Write the input property to a JSON file
	const outputFile = path.join(__dirname, "compiler-input.json");
	fs.writeFileSync(outputFile, JSON.stringify(buildInfo.input, null, 2), "utf8");
	console.log("JSON input successfully written to:", outputFile);
});

module.exports = {
	solidity: "0.8.28",
	networks: {
		sepolia: {
			url: process.env.INFURA_URL,
			accounts: [process.env.PRIVATE_KEY]
		}
	}
};