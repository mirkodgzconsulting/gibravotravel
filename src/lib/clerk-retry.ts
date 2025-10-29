import { createClerkClient } from '@clerk/backend';

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

interface CreateUserParams {
  emailAddress: string[];
  firstName: string;
  lastName: string;
  password: string;
  skipPasswordChecks?: boolean;
  publicMetadata?: Record<string, any>;
}

export class ClerkRetryService {
  private clerk: ReturnType<typeof createClerkClient>;
  private maxRetries: number;
  private delayMs: number;
  private backoffMultiplier: number;

  constructor(options: RetryOptions = {}) {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }
    
    this.clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    this.maxRetries = options.maxRetries || 3;
    this.delayMs = options.delayMs || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
  }

  async createUserWithRetry(params: CreateUserParams) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 [CLERK RETRY] Intento ${attempt}/${this.maxRetries} - Creando usuario: ${params.emailAddress[0]}`);
        
        const user = await this.clerk.users.createUser(params);
        
        console.log(`✅ [CLERK RETRY] Usuario creado exitosamente en intento ${attempt}: ${user.id}`);
        return { success: true, user, attempt };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.log(`❌ [CLERK RETRY] Intento ${attempt} falló: ${lastError.message}`);
        
        // Si es el último intento, no esperar
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Calcular delay con backoff exponencial
        const delay = this.delayMs * Math.pow(this.backoffMultiplier, attempt - 1);
        console.log(`⏳ [CLERK RETRY] Esperando ${delay}ms antes del siguiente intento...`);
        
        await this.sleep(delay);
      }
    }
    
    console.log(`❌ [CLERK RETRY] Todos los intentos fallaron para usuario: ${params.emailAddress[0]}`);
    return { 
      success: false, 
      error: lastError, 
      attempts: this.maxRetries 
    };
  }

  async deleteUserWithRetry(userId: string) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 [CLERK RETRY] Intento ${attempt}/${this.maxRetries} - Eliminando usuario: ${userId}`);
        
        await this.clerk.users.deleteUser(userId);
        
        console.log(`✅ [CLERK RETRY] Usuario eliminado exitosamente en intento ${attempt}`);
        return { success: true, attempt };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.log(`❌ [CLERK RETRY] Intento ${attempt} falló: ${lastError.message}`);
        
        if (attempt === this.maxRetries) {
          break;
        }
        
        const delay = this.delayMs * Math.pow(this.backoffMultiplier, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    return { 
      success: false, 
      error: lastError, 
      attempts: this.maxRetries 
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para verificar si un error es recuperable
  isRecoverableError(error: Error): boolean {
    const recoverableErrors = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'too many requests',
      'service unavailable',
      'internal server error',
      'bad gateway',
      'gateway timeout'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return recoverableErrors.some(recoverableError => 
      errorMessage.includes(recoverableError)
    );
  }
}

// Instancia singleton para reutilizar
export const clerkRetryService = new ClerkRetryService({
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2
});
