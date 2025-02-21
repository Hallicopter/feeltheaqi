// Initialize Web-LLM
export async function initWebLLM() {
    console.log('Starting Web-LLM initialization...');
    try {
        // Import the Web-LLM module
        console.log('Importing Web-LLM module...');
        const module = await import('/node_modules/@mlc-ai/web-llm/lib/index.js');
        
        // Make module functions available globally
        console.log('Setting up global Web-LLM functions...');
        window.CreateMLCEngine = module.CreateMLCEngine;
        window.prebuiltAppConfig = module.prebuiltAppConfig;
        
        // Log available models
        console.log('Available models:', module.prebuiltAppConfig);
        
        // Verify the module is properly loaded
        if (!window.CreateMLCEngine) {
            throw new Error('CreateMLCEngine not available after module load');
        }
        
        console.log('Web-LLM module loaded successfully');
    } catch (error) {
        console.error('Failed to load Web-LLM module:', error);
        throw error; // Re-throw to handle in the calling code
    }
}
