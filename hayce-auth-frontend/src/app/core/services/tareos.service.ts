import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppTareoItem,
  CreateTareoPayload,
  UpdateTareoPayload,
} from '../models/tareo.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class TareosService {
  private readonly graphql = inject(GraphqlApiService);

  getTareos(): Observable<AppTareoItem[]> {
    return this.graphql
      .query<{ tareos: TareoGraphql[] }>(
        `
          query Tareos {
            tareos {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              organization {
                id
                nombre
                slug
                estado
              }
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
              actividad {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
                estacion {
                  id
                  nombre
                  organization {
                    id
                    nombre
                    slug
                    estado
                  }
                }
              }
            }
          }
        `,
      )
      .pipe(map((response) => (response.tareos ?? []).map((tareo) => this.mapTareo(tareo))));
  }

  getTareoById(id: string): Observable<AppTareoItem> {
    return this.graphql
      .query<{ tareo: TareoGraphql }>(
        `
          query Tareo($id: String!) {
            tareo(id: $id) {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              organization {
                id
                nombre
                slug
                estado
              }
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
              actividad {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
                estacion {
                  id
                  nombre
                  organization {
                    id
                    nombre
                    slug
                    estado
                  }
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapTareo(response.tareo)));
  }

  createTareo(payload: CreateTareoPayload): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ createTareo: TareoGraphql }>(
        `
          mutation CreateTareo($input: CreateTareoDto!) {
            createTareo(input: $input) {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              organization {
                id
                nombre
                slug
                estado
              }
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
              actividad {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
                estacion {
                  id
                  nombre
                  organization {
                    id
                    nombre
                    slug
                    estado
                  }
                }
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapTareo(response.createTareo)));
  }

  updateTareo(id: string, payload: UpdateTareoPayload): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ updateTareo: TareoGraphql }>(
        `
          mutation UpdateTareo($id: String!, $input: UpdateTareoDto!) {
            updateTareo(id: $id, input: $input) {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              organization {
                id
                nombre
                slug
                estado
              }
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
              actividad {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
                estacion {
                  id
                  nombre
                  organization {
                    id
                    nombre
                    slug
                    estado
                  }
                }
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapTareo(response.updateTareo)));
  }

  deleteTareo(id: string): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ removeTareo: TareoGraphql }>(
        `
          mutation RemoveTareo($id: String!) {
            removeTareo(id: $id) {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              organization {
                id
                nombre
                slug
                estado
              }
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
              actividad {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
                estacion {
                  id
                  nombre
                  organization {
                    id
                    nombre
                    slug
                    estado
                  }
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapTareo(response.removeTareo)));
  }

  restoreTareo(id: string): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ restoreTareo: TareoGraphql }>(
        `
          mutation RestoreTareo($id: String!) {
            restoreTareo(id: $id) {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              organization {
                id
                nombre
                slug
                estado
              }
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
              actividad {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
                estacion {
                  id
                  nombre
                  organization {
                    id
                    nombre
                    slug
                    estado
                  }
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapTareo(response.restoreTareo)));
  }

  private mapTareo(tareo: TareoGraphql): AppTareoItem {
    return {
      _id: tareo.id,
      numero_operacion: tareo.numero_operacion,
      chasis: tareo.chasis,
      fecha: tareo.fecha,
      hora_ini: tareo.hora_ini,
      hora_fin: tareo.hora_fin,
      horas: tareo.horas,
      observacion: tareo.observacion,
      estado_tareo: tareo.estado_tareo,
      estado: tareo.estado,
      estacion: tareo.estacion,
      organization: tareo.organization
        ? {
            _id: tareo.organization.id,
            nombre: tareo.organization.nombre,
            slug: tareo.organization.slug,
            estado: tareo.organization.estado,
          }
        : null,
      creado_por: {
        _id: tareo.creado_por?.id,
        nombre: tareo.creado_por?.nombre,
        email: tareo.creado_por?.email,
      },
      trabajador: {
        _id: tareo.trabajador?.id,
        nombres: tareo.trabajador?.nombres,
        apellidos: tareo.trabajador?.apellidos,
        organization: tareo.trabajador?.organization
          ? {
              _id: tareo.trabajador.organization.id,
              nombre: tareo.trabajador.organization.nombre,
              slug: tareo.trabajador.organization.slug,
              estado: tareo.trabajador.organization.estado,
            }
          : null,
      },
      actividad: {
        _id: tareo.actividad?.id,
        nombre: tareo.actividad?.nombre,
        organization: tareo.actividad?.organization
          ? {
              _id: tareo.actividad.organization.id,
              nombre: tareo.actividad.organization.nombre,
              slug: tareo.actividad.organization.slug,
              estado: tareo.actividad.organization.estado,
            }
          : null,
        estacion: {
          _id: tareo.actividad?.estacion?.id,
          nombre: tareo.actividad?.estacion?.nombre,
          organization: tareo.actividad?.estacion?.organization
            ? {
                _id: tareo.actividad.estacion.organization.id,
                nombre: tareo.actividad.estacion.organization.nombre,
                slug: tareo.actividad.estacion.organization.slug,
                estado: tareo.actividad.estacion.organization.estado,
              }
            : null,
        },
      } as any,
      estacion_ref: {
        _id: tareo.actividad?.estacion?.id,
        nombre: tareo.actividad?.estacion?.nombre,
        organization: tareo.actividad?.estacion?.organization
          ? {
              _id: tareo.actividad.estacion.organization.id,
              nombre: tareo.actividad.estacion.organization.nombre,
              slug: tareo.actividad.estacion.organization.slug,
              estado: tareo.actividad.estacion.organization.estado,
            }
          : null,
      },
    };
  }
}

interface TareoGraphql {
  id: string;
  numero_operacion: string;
  chasis: string;
  fecha: string;
  hora_ini: string;
  hora_fin?: string;
  horas: number;
  observacion?: string;
  estado_tareo: any;
  estado: boolean;
  estacion: string;
  organization?: {
    id: string;
    nombre: string;
    slug: string;
    estado: boolean;
  } | null;
  creado_por?: {
    id: string;
    nombre: string;
    email: string;
  };
  trabajador?: {
    id: string;
    nombres: string;
    apellidos: string;
    organization?: {
      id: string;
      nombre: string;
      slug: string;
      estado: boolean;
    } | null;
  };
  actividad?: {
    id: string;
    nombre: string;
    organization?: {
      id: string;
      nombre: string;
      slug: string;
      estado: boolean;
    } | null;
    estacion?: {
      id: string;
      nombre: string;
      organization?: {
        id: string;
        nombre: string;
        slug: string;
        estado: boolean;
      } | null;
    };
  };
}
