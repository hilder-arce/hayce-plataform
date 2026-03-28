import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import DataLoader from 'dataloader';
import { Model } from 'mongoose';
import { Module as SystemModule } from 'src/modules/entities/module.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class GraphqlLoadersService {
  readonly userById: DataLoader<string, User | null>;
  readonly roleById: DataLoader<string, Role | null>;
  readonly permissionById: DataLoader<string, Permission | null>;
  readonly moduleById: DataLoader<string, SystemModule | null>;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(SystemModule.name)
    private readonly moduleModel: Model<SystemModule>,
  ) {
    this.userById = this.createLoader(this.userModel);
    this.roleById = this.createLoader(this.roleModel);
    this.permissionById = this.createLoader(this.permissionModel);
    this.moduleById = this.createLoader(this.moduleModel);
  }

  private createLoader<T extends { _id: unknown }>(model: Model<T>) {
    return new DataLoader<string, T | null>(async (keys) => {
      const documents = await model.find({
        _id: { $in: keys },
      } as any);

      const map = new Map(
        documents.map((document) => [String(document._id), document] as const),
      );
      return keys.map((key) => map.get(key) ?? null);
    });
  }
}
