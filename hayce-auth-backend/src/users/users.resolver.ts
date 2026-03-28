import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { PaginationArgs } from 'src/common/graphql/types/pagination.args';
import { MessageResponse } from 'src/common/graphql/types/message-response.type';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersPage } from './graphql/users-page.type';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  @RequirePermission('crear_usuario')
  createUser(
    @Args('input') input: CreateUserDto,
    @CurrentUser() user: { nombre: string },
  ) {
    return this.usersService.create(input, user.nombre);
  }

  @Query(() => UsersPage)
  @RequirePermission('listar_usuarios')
  users(@Args() args: PaginationArgs) {
    return this.usersService.findAll(args.page, args.limit, args.search ?? '');
  }

  @Query(() => UsersPage)
  @RequirePermission('listar_usuarios')
  inactiveUsers(@Args() args: PaginationArgs) {
    return this.usersService.findAllInactive(
      args.page,
      args.limit,
      args.search ?? '',
    );
  }

  @Query(() => User)
  @RequirePermission('listar_usuarios')
  user(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Query(() => User)
  @RequirePermission('listar_usuarios')
  inactiveUser(@Args('id') id: string) {
    return this.usersService.findOneInactive(id);
  }

  @Mutation(() => User)
  updateMyProfile(
    @CurrentUser() user: { sub: string },
    @Args('input') input: UpdateUserDto,
  ) {
    return this.usersService.updateOwnProfile(user.sub, input);
  }

  @Mutation(() => MessageResponse)
  changeMyPassword(
    @CurrentUser() user: { sub: string },
    @Args('input') input: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, input);
  }

  @Mutation(() => User)
  @RequirePermission('actualizar_usuario')
  updateUser(
    @Args('id') id: string,
    @Args('input') input: UpdateUserDto,
    @CurrentUser() user: { nombre?: string },
  ) {
    return this.usersService.update(id, input, user?.nombre);
  }

  @Mutation(() => User)
  @RequirePermission('eliminar_usuario')
  restoreUser(@Args('id') id: string) {
    return this.usersService.reactivate(id);
  }

  @Mutation(() => User)
  @RequirePermission('eliminar_usuario')
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id);
  }

  @Mutation(() => MessageResponse)
  @RequirePermission('cambiar_password')
  adminChangePassword(
    @Args('id') id: string,
    @Args('input') input: AdminChangePasswordDto,
  ) {
    return this.usersService.adminChangePassword(id, input);
  }
}
