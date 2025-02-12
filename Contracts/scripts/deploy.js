const fs = require('fs');
const path = require('path');

async function main() {
    const addressFile = path.join(__dirname, '../deployed-address.json');

    try {
        const Tournament = await ethers.getContractFactory("tournamentResults");
        const tournament = await Tournament.deploy();
        await tournament.waitForDeployment();
        const address = await tournament.getAddress();

        // Create directory if it doesn't exist
        const dir = path.dirname(addressFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Save deployment address
        fs.writeFileSync(addressFile, JSON.stringify({
            address,
            deployedAt: new Date().toISOString()
        }, null, 2));

        console.log("New contract deployed to:", address);
        console.log("Address saved to:", addressFile);
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