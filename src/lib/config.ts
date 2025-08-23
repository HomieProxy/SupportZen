
import fs from 'fs/promises';
import path from 'path';

interface AppConfig {
    allowedDomains: string[];
    clientApiSecretKey?: string;
}

const configFilePath = path.join(process.cwd(), 'supportzen.config.json');

async function readConfigFile(): Promise<AppConfig> {
    try {
        const fileContent = await fs.readFile(configFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // Config file doesn't exist, so return a default config
            return { allowedDomains: [], clientApiSecretKey: 'default_insecure_secret_key_for_development_only' };
        }
        console.error('Error reading config file:', error);
        throw new Error('Could not read application configuration.');
    }
}

async function writeConfigFile(config: AppConfig): Promise<void> {
    try {
        await fs.writeFile(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing config file:', error);
        throw new Error('Could not save application configuration.');
    }
}

export async function getAllowDomains(): Promise<string[]> {
    const config = await readConfigFile();
    return config.allowedDomains || [];
}

export async function setAllowDomains(domains: string[]): Promise<void> {
    const config = await readConfigFile();
    const newConfig: AppConfig = { ...config, allowedDomains: domains };
    await writeConfigFile(newConfig);
}

export async function getClientApiSecretKey(): Promise<string> {
    const config = await readConfigFile();
    return config.clientApiSecretKey || 'default_insecure_secret_key_for_development_only';
}

export async function setClientApiSecretKey(key: string): Promise<void> {
    const config = await readConfigFile();
    const newConfig: AppConfig = { ...config, clientApiSecretKey: key };
    await writeConfigFile(newConfig);
}
