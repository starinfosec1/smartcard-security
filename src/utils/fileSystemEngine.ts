import { SmartCardNode, FileType } from '../types';

export interface FileSystemResult {
  success: boolean;
  message: string;
  nodes?: Record<string, SmartCardNode>;
  targetNode?: SmartCardNode;
}

/**
 * Initial standard file system for Experiment 1
 * MF
 * ├── DF_STUDENT
 * │   ├── EF_NAME
 * │   └── EF_ROLL
 * └── DF_COLLEGE
 *     └── EF_DEPT
 */
export function createInitialFileSystem(): Record<string, SmartCardNode> {
  return {
    mf: {
      id: 'mf',
      name: 'MF',
      type: 'MF',
      parentId: null,
      children: ['df_student', 'df_college'],
    },
    df_student: {
      id: 'df_student',
      name: 'DF_STUDENT',
      type: 'DF',
      parentId: 'mf',
      children: ['ef_name', 'ef_roll'],
    },
    ef_name: {
      id: 'ef_name',
      name: 'EF_NAME',
      type: 'EF',
      parentId: 'df_student',
      data: 'STUDENT',
      size: 20,
    },
    ef_roll: {
      id: 'ef_roll',
      name: 'EF_ROLL',
      type: 'EF',
      parentId: 'df_student',
      data: '101',
      size: 10,
    },
    df_college: {
      id: 'df_college',
      name: 'DF_COLLEGE',
      type: 'DF',
      parentId: 'mf',
      children: ['ef_dept'],
    },
    ef_dept: {
      id: 'ef_dept',
      name: 'EF_DEPT',
      type: 'EF',
      parentId: 'df_college',
      data: 'CYBER',
      size: 15,
    },
  };
}

/**
 * Initial file system for Experiment 2 (Modify Operation)
 * Contains EF_MARKS with initial value "65" and size 10
 */
export function createExp2FileSystem(): Record<string, SmartCardNode> {
  const fs = createInitialFileSystem();
  fs['ef_marks'] = {
    id: 'ef_marks',
    name: 'EF_MARKS',
    type: 'EF',
    parentId: 'df_student',
    data: '65',
    size: 10,
  };
  fs['df_student'].children = ['ef_name', 'ef_roll', 'ef_marks'];
  return fs;
}

export class SmartCardFileSystemEngine {
  private nodes: Record<string, SmartCardNode>;

  constructor(initialNodes?: Record<string, SmartCardNode>) {
    this.nodes = initialNodes ? JSON.parse(JSON.stringify(initialNodes)) : createInitialFileSystem();
  }

  public getNodes(): Record<string, SmartCardNode> {
    return JSON.parse(JSON.stringify(this.nodes));
  }

  public findFile(idOrName: string): SmartCardNode | null {
    const direct = this.nodes[idOrName.toLowerCase()];
    if (direct) return direct;
    for (const id in this.nodes) {
      if (this.nodes[id].name.toUpperCase() === idOrName.toUpperCase()) {
        return this.nodes[id];
      }
    }
    return null;
  }

  public validateParent(parentId: string): { valid: boolean; error?: string; parent?: SmartCardNode } {
    const parent = this.findFile(parentId);
    if (!parent) {
      return { valid: false, error: 'Parent directory does not exist.' };
    }
    if (parent.type === 'EF') {
      return { 
        valid: false, 
        error: 'Cannot create file here. An EF (Elementary File) cannot contain another file.' 
      };
    }
    return { valid: true, parent };
  }

  public validateFileName(name: string, parentId: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, error: 'File name cannot be empty.' };
    }
    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      return { valid: false, error: 'File name must contain only letters, numbers, and underscores.' };
    }
    const parent = this.findFile(parentId);
    if (parent && parent.children) {
      const duplicate = parent.children.some(childId => {
        const child = this.nodes[childId];
        return child && child.name.toUpperCase() === trimmed.toUpperCase();
      });
      if (duplicate) {
        return { valid: false, error: `A file named "${trimmed.toUpperCase()}" already exists in ${parent.name}.` };
      }
    }
    return { valid: true };
  }

  public createFile(type: FileType, name: string, parentIdOrName: string): FileSystemResult {
    const cleanName = name.trim().toUpperCase();
    if (type === 'MF') {
      return { success: false, message: 'Invalid operation: A smart card only allows one Master File (MF).' };
    }

    // Validate parent
    const parentCheck = this.validateParent(parentIdOrName);
    if (!parentCheck.valid || !parentCheck.parent) {
      return { success: false, message: parentCheck.error || 'Invalid parent directory.' };
    }
    const parent = parentCheck.parent;

    // Validate name
    const nameCheck = this.validateFileName(cleanName, parent.id);
    if (!nameCheck.valid) {
      return { success: false, message: nameCheck.error || 'Invalid file name.' };
    }

    // Generate unique ID
    const newId = `${type.toLowerCase()}_${cleanName.toLowerCase()}_${Date.now() % 10000}`;
    const newNode: SmartCardNode = {
      id: newId,
      name: cleanName,
      type,
      parentId: parent.id,
      children: type === 'DF' ? [] : undefined,
      data: type === 'EF' ? '' : undefined,
      size: type === 'EF' ? 20 : undefined,
    };

    this.nodes[newId] = newNode;
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(newId);

    return {
      success: true,
      message: `Created ${type} "${cleanName}" successfully under ${parent.name}.`,
      nodes: this.getNodes(),
      targetNode: newNode,
    };
  }

  public deleteFile(idOrName: string): FileSystemResult {
    const target = this.findFile(idOrName);
    if (!target) {
      return { success: false, message: `File "${idOrName}" does not exist.` };
    }

    if (target.type === 'MF') {
      return { success: false, message: 'Delete rejected: Master File (MF) cannot be deleted.' };
    }

    // If DF, check if it has children
    if (target.children && target.children.length > 0) {
      return { 
        success: false, 
        message: `Cannot delete DF "${target.name}". It contains child files. Delete its children first.` 
      };
    }

    // Remove from parent's children array
    if (target.parentId && this.nodes[target.parentId]) {
      const parent = this.nodes[target.parentId];
      if (parent.children) {
        parent.children = parent.children.filter(cid => cid !== target.id);
      }
    }

    const deletedName = target.name;
    const deletedType = target.type;
    delete this.nodes[target.id];

    return {
      success: true,
      message: `Deleted ${deletedType} "${deletedName}" successfully.`,
      nodes: this.getNodes(),
    };
  }

  public modifyFile(idOrName: string, newData: string): FileSystemResult {
    const target = this.findFile(idOrName);
    if (!target) {
      return { success: false, message: `Modify failed: File "${idOrName}" does not exist.` };
    }

    if (target.type !== 'EF') {
      return { 
        success: false, 
        message: `Modify failed: Only Elementary Files (EF) can store and modify data. ${target.name} is a ${target.type}.` 
      };
    }

    const trimmedData = newData.trim();
    if (trimmedData.length === 0) {
      return { success: false, message: 'Modify failed: New data cannot be empty.' };
    }

    const byteLength = new TextEncoder().encode(trimmedData).length;
    const maxCapacity = target.size || 20;

    if (byteLength > maxCapacity) {
      return { 
        success: false, 
        message: `Modify failed: data is larger than the file size (${byteLength} bytes > ${maxCapacity} bytes limit).` 
      };
    }

    target.data = trimmedData;

    return {
      success: true,
      message: `Data in "${target.name}" modified successfully to "${trimmedData}".`,
      nodes: this.getNodes(),
      targetNode: target,
    };
  }
}
