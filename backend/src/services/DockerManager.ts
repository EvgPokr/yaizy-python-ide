import Docker from 'dockerode';
import { DockerContainerConfig } from '../types/session';

export class DockerManager {
  private docker: Docker;
  private config: DockerContainerConfig;

  constructor() {
    this.docker = new Docker();
    
    this.config = {
      image: process.env.DOCKER_IMAGE || 'python-sandbox:latest',
      memory: process.env.DOCKER_MEMORY_LIMIT || '256m',
      cpus: parseFloat(process.env.DOCKER_CPU_LIMIT || '0.5'),
      pidsLimit: parseInt(process.env.DOCKER_PIDS_LIMIT || '64', 10),
      networkMode: process.env.DOCKER_NETWORK_MODE || 'none',
      readOnly: true,
      user: 'student',
      workDir: '/workspace',
      binds: [],
    };
  }

  /**
   * Create and start a Docker container for a Python session
   */
  async createContainer(sessionId: string, workspaceDir: string): Promise<string> {
    try {
      console.log(`Creating Docker container for session ${sessionId}...`);

      // Create container with security restrictions
      const container = await this.docker.createContainer({
        Image: this.config.image,
        name: `python-session-${sessionId}`,
        AttachStdin: false,
        AttachStdout: false,
        AttachStderr: false,
        Tty: true,
        OpenStdin: true,
        User: this.config.user,
        WorkingDir: this.config.workDir,
        HostConfig: {
          // Memory limit
          Memory: this.parseMemoryLimit(this.config.memory),
          MemorySwap: this.parseMemoryLimit(this.config.memory), // Disable swap
          
          // CPU limit
          NanoCpus: this.config.cpus * 1e9,
          
          // PID limit (prevent fork bombs)
          PidsLimit: this.config.pidsLimit,
          
          // Network: disabled for security
          NetworkMode: this.config.networkMode,
          
          // Filesystem: read-only except workspace
          ReadonlyRootfs: this.config.readOnly,
          Binds: [
            `${workspaceDir}:${this.config.workDir}:rw`,
          ],
          
          // Security options
          CapDrop: ['ALL'], // Drop all capabilities
          SecurityOpt: ['no-new-privileges'], // Prevent privilege escalation
          
          // Resource limits
          Ulimits: [
            { Name: 'nofile', Soft: 256, Hard: 256 }, // Open files limit
            { Name: 'nproc', Soft: 256, Hard: 256 },  // Process limit (need more for Xvfb + Python)
          ],
        },
        // Use CMD from Dockerfile (starts Xvfb)
      });

      // Start the container
      await container.start();
      
      console.log(`Container ${container.id} started for session ${sessionId}`);
      return container.id;

    } catch (error) {
      console.error(`Failed to create container for session ${sessionId}:`, error);
      throw new Error(`Container creation failed: ${error}`);
    }
  }

  /**
   * Stop and remove a container
   */
  async removeContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      
      // Try graceful stop first
      try {
        await container.stop({ t: 5 }); // 5 second timeout
      } catch (error) {
        // Container might already be stopped
        console.log(`Container ${containerId} already stopped or error:`, error);
      }

      // Remove container
      await container.remove({ force: true, v: true });
      console.log(`Container ${containerId} removed`);

    } catch (error) {
      console.error(`Failed to remove container ${containerId}:`, error);
      // Don't throw - cleanup should be best-effort
    }
  }

  /**
   * Kill a running process inside container
   */
  async killProcess(containerId: string, signal: string = 'SIGINT'): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.kill({ signal });
      console.log(`Sent ${signal} to container ${containerId}`);
    } catch (error) {
      console.error(`Failed to kill process in container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Check if Docker is available
   */
  async checkDocker(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      console.error('Docker is not available:', error);
      return false;
    }
  }

  /**
   * Check if the Python sandbox image exists
   */
  async checkImage(): Promise<boolean> {
    try {
      const images = await this.docker.listImages();
      const imageExists = images.some(img => 
        img.RepoTags?.includes(this.config.image)
      );
      
      if (!imageExists) {
        console.warn(`Docker image ${this.config.image} not found!`);
        console.warn('Please build it with: docker build -t python-sandbox:latest ./docker/python-sandbox');
      }
      
      return imageExists;
    } catch (error) {
      console.error('Failed to check Docker image:', error);
      return false;
    }
  }

  /**
   * Get container stats
   */
  async getContainerStats(containerId: string): Promise<any> {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      return stats;
    } catch (error) {
      console.error(`Failed to get stats for container ${containerId}:`, error);
      return null;
    }
  }

  /**
   * List all session containers
   */
  async listSessionContainers(): Promise<any[]> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          name: ['python-session-'],
        },
      });
      return containers;
    } catch (error) {
      console.error('Failed to list session containers:', error);
      return [];
    }
  }

  /**
   * Cleanup orphaned containers
   */
  async cleanupOrphanedContainers(): Promise<void> {
    try {
      const containers = await this.listSessionContainers();
      
      for (const containerInfo of containers) {
        const createdAt = new Date(containerInfo.Created * 1000);
        const age = Date.now() - createdAt.getTime();
        
        // Remove containers older than 1 hour
        if (age > 3600000) {
          console.log(`Cleaning up orphaned container: ${containerInfo.Id}`);
          await this.removeContainer(containerInfo.Id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned containers:', error);
    }
  }

  /**
   * Parse memory limit string to bytes
   */
  private parseMemoryLimit(limit: string): number {
    const units: { [key: string]: number } = {
      'b': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024,
    };

    const match = limit.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) {
      throw new Error(`Invalid memory limit format: ${limit}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 'b';
    
    return value * units[unit];
  }
}
