#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

/**
 * Axe Developer Hub Scan Script using @axe-core/puppeteer
 * Usage: node scan.js <url> <api-key> [server-url] [build-id] [branch-name]
 */

async function runScan() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error(JSON.stringify({
            success: false,
            error: 'Usage: node scan.js <url> <api-key> [server-url] [build-id] [branch-name]'
        }));
        process.exit(1);
    }

    const [url, apiKey, serverURL, buildID, branchName] = args;
    
    let browser;
    let page;
    
    try {
        // Validate URL
        new URL(url);
        
        // Launch browser with optimized settings for shared hosting
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        
        page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the URL with timeout
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for page to be fully loaded
        await page.waitForTimeout(2000);
        
        // Run axe-core accessibility scan
        const results = await new AxePuppeteer(page).analyze();
        
        // Output results for PHP to capture
        console.log(JSON.stringify({
            success: true,
            url: url,
            timestamp: new Date().toISOString(),
            violations: results ? results.violations.length : 0,
            passes: results ? results.passes.length : 0,
            incomplete: results ? results.incomplete.length : 0,
            inapplicable: results ? results.inapplicable.length : 0,
            axeVersion: results ? results.testEngine.version : 'unknown',
            buildID: buildID || `scan-${Date.now()}`,
            branchName: branchName || 'main',
            message: 'Accessibility scan completed successfully',
            detailedResults: results ? {
                violations: results.violations.map(v => ({
                    id: v.id,
                    impact: v.impact,
                    description: v.description,
                    help: v.help,
                    helpUrl: v.helpUrl,
                    tags: v.tags,
                    nodes: v.nodes.length
                })),
                passes: results.passes.length,
                incomplete: results.incomplete.map(i => ({
                    id: i.id,
                    impact: i.impact,
                    description: i.description,
                    nodes: i.nodes.length
                }))
            } : null
        }));
        
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            url: url || 'unknown',
            timestamp: new Date().toISOString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }));
        process.exit(1);
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(JSON.stringify({
        success: false,
        error: `Uncaught exception: ${error.message}`,
        timestamp: new Date().toISOString()
    }));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(JSON.stringify({
        success: false,
        error: `Unhandled rejection: ${reason}`,
        timestamp: new Date().toISOString()
    }));
    process.exit(1);
});

// Run the scan
runScan();