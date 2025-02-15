const fs = require('fs');
const path = require('path');
const hre = require("hardhat"); // Import Hardhat runtime environment

async function main() {
	const addressFile = path.join('/usr/src/contracts', 'deployed-address.json');

	try {
		if (fs.existsSync(addressFile)) {
			const deployed = JSON.parse(fs.readFileSync(addressFile));
			console.log('Using existing contract at:', deployed.address);
			// Run custom task to generate compiler input after deployment
			await hre.run("print-json-input");
			return deployed.address;
		}

		const Tournament = await ethers.getContractFactory("tournamentResults");
		const tournament = await Tournament.deploy();
		await tournament.waitForDeployment();
		const address = await tournament.getAddress();

		fs.writeFileSync(
			addressFile,
			JSON.stringify(
				{
					address,
					deployedAt: new Date().toISOString(),
				},
				null,
				2
			)
		);

		console.log("New contract deployed to:", address);

		// Run the custom task to write the compiler input JSON file
		await hre.run("print-json-input");

		return address;
	} catch (error) {
		console.error("Deployment failed:", error.message);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});