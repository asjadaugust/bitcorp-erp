// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'valorization_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ValorizationModel {

 int get id; String get periodo;@JsonKey(name: 'numero_valorizacion') String? get numeroValorizacion;@JsonKey(name: 'equipo_id') int? get equipoId;@JsonKey(name: 'contrato_id') int? get contratoId;@JsonKey(name: 'fecha_inicio') String? get fechaInicio;@JsonKey(name: 'fecha_fin') String? get fechaFin;@JsonKey(name: 'dias_trabajados') int? get diasTrabajados;@JsonKey(name: 'horas_trabajadas') double? get horasTrabajadas;@JsonKey(name: 'total_valorizado') double get totalValorizado;@JsonKey(name: 'igv_monto') double? get igvMonto;@JsonKey(name: 'total_con_igv') double get totalConIgv; String get estado;@JsonKey(name: 'codigo_equipo') String? get codigoEquipo;@JsonKey(name: 'equipo_marca') String? get equipoMarca;@JsonKey(name: 'equipo_modelo') String? get equipoModelo;
/// Create a copy of ValorizationModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ValorizationModelCopyWith<ValorizationModel> get copyWith => _$ValorizationModelCopyWithImpl<ValorizationModel>(this as ValorizationModel, _$identity);

  /// Serializes this ValorizationModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValorizationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.periodo, periodo) || other.periodo == periodo)&&(identical(other.numeroValorizacion, numeroValorizacion) || other.numeroValorizacion == numeroValorizacion)&&(identical(other.equipoId, equipoId) || other.equipoId == equipoId)&&(identical(other.contratoId, contratoId) || other.contratoId == contratoId)&&(identical(other.fechaInicio, fechaInicio) || other.fechaInicio == fechaInicio)&&(identical(other.fechaFin, fechaFin) || other.fechaFin == fechaFin)&&(identical(other.diasTrabajados, diasTrabajados) || other.diasTrabajados == diasTrabajados)&&(identical(other.horasTrabajadas, horasTrabajadas) || other.horasTrabajadas == horasTrabajadas)&&(identical(other.totalValorizado, totalValorizado) || other.totalValorizado == totalValorizado)&&(identical(other.igvMonto, igvMonto) || other.igvMonto == igvMonto)&&(identical(other.totalConIgv, totalConIgv) || other.totalConIgv == totalConIgv)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.codigoEquipo, codigoEquipo) || other.codigoEquipo == codigoEquipo)&&(identical(other.equipoMarca, equipoMarca) || other.equipoMarca == equipoMarca)&&(identical(other.equipoModelo, equipoModelo) || other.equipoModelo == equipoModelo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,periodo,numeroValorizacion,equipoId,contratoId,fechaInicio,fechaFin,diasTrabajados,horasTrabajadas,totalValorizado,igvMonto,totalConIgv,estado,codigoEquipo,equipoMarca,equipoModelo);

@override
String toString() {
  return 'ValorizationModel(id: $id, periodo: $periodo, numeroValorizacion: $numeroValorizacion, equipoId: $equipoId, contratoId: $contratoId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, diasTrabajados: $diasTrabajados, horasTrabajadas: $horasTrabajadas, totalValorizado: $totalValorizado, igvMonto: $igvMonto, totalConIgv: $totalConIgv, estado: $estado, codigoEquipo: $codigoEquipo, equipoMarca: $equipoMarca, equipoModelo: $equipoModelo)';
}


}

/// @nodoc
abstract mixin class $ValorizationModelCopyWith<$Res>  {
  factory $ValorizationModelCopyWith(ValorizationModel value, $Res Function(ValorizationModel) _then) = _$ValorizationModelCopyWithImpl;
@useResult
$Res call({
 int id, String periodo,@JsonKey(name: 'numero_valorizacion') String? numeroValorizacion,@JsonKey(name: 'equipo_id') int? equipoId,@JsonKey(name: 'contrato_id') int? contratoId,@JsonKey(name: 'fecha_inicio') String? fechaInicio,@JsonKey(name: 'fecha_fin') String? fechaFin,@JsonKey(name: 'dias_trabajados') int? diasTrabajados,@JsonKey(name: 'horas_trabajadas') double? horasTrabajadas,@JsonKey(name: 'total_valorizado') double totalValorizado,@JsonKey(name: 'igv_monto') double? igvMonto,@JsonKey(name: 'total_con_igv') double totalConIgv, String estado,@JsonKey(name: 'codigo_equipo') String? codigoEquipo,@JsonKey(name: 'equipo_marca') String? equipoMarca,@JsonKey(name: 'equipo_modelo') String? equipoModelo
});




}
/// @nodoc
class _$ValorizationModelCopyWithImpl<$Res>
    implements $ValorizationModelCopyWith<$Res> {
  _$ValorizationModelCopyWithImpl(this._self, this._then);

  final ValorizationModel _self;
  final $Res Function(ValorizationModel) _then;

/// Create a copy of ValorizationModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? periodo = null,Object? numeroValorizacion = freezed,Object? equipoId = freezed,Object? contratoId = freezed,Object? fechaInicio = freezed,Object? fechaFin = freezed,Object? diasTrabajados = freezed,Object? horasTrabajadas = freezed,Object? totalValorizado = null,Object? igvMonto = freezed,Object? totalConIgv = null,Object? estado = null,Object? codigoEquipo = freezed,Object? equipoMarca = freezed,Object? equipoModelo = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,periodo: null == periodo ? _self.periodo : periodo // ignore: cast_nullable_to_non_nullable
as String,numeroValorizacion: freezed == numeroValorizacion ? _self.numeroValorizacion : numeroValorizacion // ignore: cast_nullable_to_non_nullable
as String?,equipoId: freezed == equipoId ? _self.equipoId : equipoId // ignore: cast_nullable_to_non_nullable
as int?,contratoId: freezed == contratoId ? _self.contratoId : contratoId // ignore: cast_nullable_to_non_nullable
as int?,fechaInicio: freezed == fechaInicio ? _self.fechaInicio : fechaInicio // ignore: cast_nullable_to_non_nullable
as String?,fechaFin: freezed == fechaFin ? _self.fechaFin : fechaFin // ignore: cast_nullable_to_non_nullable
as String?,diasTrabajados: freezed == diasTrabajados ? _self.diasTrabajados : diasTrabajados // ignore: cast_nullable_to_non_nullable
as int?,horasTrabajadas: freezed == horasTrabajadas ? _self.horasTrabajadas : horasTrabajadas // ignore: cast_nullable_to_non_nullable
as double?,totalValorizado: null == totalValorizado ? _self.totalValorizado : totalValorizado // ignore: cast_nullable_to_non_nullable
as double,igvMonto: freezed == igvMonto ? _self.igvMonto : igvMonto // ignore: cast_nullable_to_non_nullable
as double?,totalConIgv: null == totalConIgv ? _self.totalConIgv : totalConIgv // ignore: cast_nullable_to_non_nullable
as double,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,codigoEquipo: freezed == codigoEquipo ? _self.codigoEquipo : codigoEquipo // ignore: cast_nullable_to_non_nullable
as String?,equipoMarca: freezed == equipoMarca ? _self.equipoMarca : equipoMarca // ignore: cast_nullable_to_non_nullable
as String?,equipoModelo: freezed == equipoModelo ? _self.equipoModelo : equipoModelo // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ValorizationModel].
extension ValorizationModelPatterns on ValorizationModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ValorizationModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ValorizationModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ValorizationModel value)  $default,){
final _that = this;
switch (_that) {
case _ValorizationModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ValorizationModel value)?  $default,){
final _that = this;
switch (_that) {
case _ValorizationModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String periodo, @JsonKey(name: 'numero_valorizacion')  String? numeroValorizacion, @JsonKey(name: 'equipo_id')  int? equipoId, @JsonKey(name: 'contrato_id')  int? contratoId, @JsonKey(name: 'fecha_inicio')  String? fechaInicio, @JsonKey(name: 'fecha_fin')  String? fechaFin, @JsonKey(name: 'dias_trabajados')  int? diasTrabajados, @JsonKey(name: 'horas_trabajadas')  double? horasTrabajadas, @JsonKey(name: 'total_valorizado')  double totalValorizado, @JsonKey(name: 'igv_monto')  double? igvMonto, @JsonKey(name: 'total_con_igv')  double totalConIgv,  String estado, @JsonKey(name: 'codigo_equipo')  String? codigoEquipo, @JsonKey(name: 'equipo_marca')  String? equipoMarca, @JsonKey(name: 'equipo_modelo')  String? equipoModelo)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValorizationModel() when $default != null:
return $default(_that.id,_that.periodo,_that.numeroValorizacion,_that.equipoId,_that.contratoId,_that.fechaInicio,_that.fechaFin,_that.diasTrabajados,_that.horasTrabajadas,_that.totalValorizado,_that.igvMonto,_that.totalConIgv,_that.estado,_that.codigoEquipo,_that.equipoMarca,_that.equipoModelo);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String periodo, @JsonKey(name: 'numero_valorizacion')  String? numeroValorizacion, @JsonKey(name: 'equipo_id')  int? equipoId, @JsonKey(name: 'contrato_id')  int? contratoId, @JsonKey(name: 'fecha_inicio')  String? fechaInicio, @JsonKey(name: 'fecha_fin')  String? fechaFin, @JsonKey(name: 'dias_trabajados')  int? diasTrabajados, @JsonKey(name: 'horas_trabajadas')  double? horasTrabajadas, @JsonKey(name: 'total_valorizado')  double totalValorizado, @JsonKey(name: 'igv_monto')  double? igvMonto, @JsonKey(name: 'total_con_igv')  double totalConIgv,  String estado, @JsonKey(name: 'codigo_equipo')  String? codigoEquipo, @JsonKey(name: 'equipo_marca')  String? equipoMarca, @JsonKey(name: 'equipo_modelo')  String? equipoModelo)  $default,) {final _that = this;
switch (_that) {
case _ValorizationModel():
return $default(_that.id,_that.periodo,_that.numeroValorizacion,_that.equipoId,_that.contratoId,_that.fechaInicio,_that.fechaFin,_that.diasTrabajados,_that.horasTrabajadas,_that.totalValorizado,_that.igvMonto,_that.totalConIgv,_that.estado,_that.codigoEquipo,_that.equipoMarca,_that.equipoModelo);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String periodo, @JsonKey(name: 'numero_valorizacion')  String? numeroValorizacion, @JsonKey(name: 'equipo_id')  int? equipoId, @JsonKey(name: 'contrato_id')  int? contratoId, @JsonKey(name: 'fecha_inicio')  String? fechaInicio, @JsonKey(name: 'fecha_fin')  String? fechaFin, @JsonKey(name: 'dias_trabajados')  int? diasTrabajados, @JsonKey(name: 'horas_trabajadas')  double? horasTrabajadas, @JsonKey(name: 'total_valorizado')  double totalValorizado, @JsonKey(name: 'igv_monto')  double? igvMonto, @JsonKey(name: 'total_con_igv')  double totalConIgv,  String estado, @JsonKey(name: 'codigo_equipo')  String? codigoEquipo, @JsonKey(name: 'equipo_marca')  String? equipoMarca, @JsonKey(name: 'equipo_modelo')  String? equipoModelo)?  $default,) {final _that = this;
switch (_that) {
case _ValorizationModel() when $default != null:
return $default(_that.id,_that.periodo,_that.numeroValorizacion,_that.equipoId,_that.contratoId,_that.fechaInicio,_that.fechaFin,_that.diasTrabajados,_that.horasTrabajadas,_that.totalValorizado,_that.igvMonto,_that.totalConIgv,_that.estado,_that.codigoEquipo,_that.equipoMarca,_that.equipoModelo);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ValorizationModel implements ValorizationModel {
  const _ValorizationModel({required this.id, required this.periodo, @JsonKey(name: 'numero_valorizacion') this.numeroValorizacion, @JsonKey(name: 'equipo_id') this.equipoId, @JsonKey(name: 'contrato_id') this.contratoId, @JsonKey(name: 'fecha_inicio') this.fechaInicio, @JsonKey(name: 'fecha_fin') this.fechaFin, @JsonKey(name: 'dias_trabajados') this.diasTrabajados, @JsonKey(name: 'horas_trabajadas') this.horasTrabajadas, @JsonKey(name: 'total_valorizado') this.totalValorizado = 0, @JsonKey(name: 'igv_monto') this.igvMonto, @JsonKey(name: 'total_con_igv') this.totalConIgv = 0, required this.estado, @JsonKey(name: 'codigo_equipo') this.codigoEquipo, @JsonKey(name: 'equipo_marca') this.equipoMarca, @JsonKey(name: 'equipo_modelo') this.equipoModelo});
  factory _ValorizationModel.fromJson(Map<String, dynamic> json) => _$ValorizationModelFromJson(json);

@override final  int id;
@override final  String periodo;
@override@JsonKey(name: 'numero_valorizacion') final  String? numeroValorizacion;
@override@JsonKey(name: 'equipo_id') final  int? equipoId;
@override@JsonKey(name: 'contrato_id') final  int? contratoId;
@override@JsonKey(name: 'fecha_inicio') final  String? fechaInicio;
@override@JsonKey(name: 'fecha_fin') final  String? fechaFin;
@override@JsonKey(name: 'dias_trabajados') final  int? diasTrabajados;
@override@JsonKey(name: 'horas_trabajadas') final  double? horasTrabajadas;
@override@JsonKey(name: 'total_valorizado') final  double totalValorizado;
@override@JsonKey(name: 'igv_monto') final  double? igvMonto;
@override@JsonKey(name: 'total_con_igv') final  double totalConIgv;
@override final  String estado;
@override@JsonKey(name: 'codigo_equipo') final  String? codigoEquipo;
@override@JsonKey(name: 'equipo_marca') final  String? equipoMarca;
@override@JsonKey(name: 'equipo_modelo') final  String? equipoModelo;

/// Create a copy of ValorizationModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ValorizationModelCopyWith<_ValorizationModel> get copyWith => __$ValorizationModelCopyWithImpl<_ValorizationModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ValorizationModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValorizationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.periodo, periodo) || other.periodo == periodo)&&(identical(other.numeroValorizacion, numeroValorizacion) || other.numeroValorizacion == numeroValorizacion)&&(identical(other.equipoId, equipoId) || other.equipoId == equipoId)&&(identical(other.contratoId, contratoId) || other.contratoId == contratoId)&&(identical(other.fechaInicio, fechaInicio) || other.fechaInicio == fechaInicio)&&(identical(other.fechaFin, fechaFin) || other.fechaFin == fechaFin)&&(identical(other.diasTrabajados, diasTrabajados) || other.diasTrabajados == diasTrabajados)&&(identical(other.horasTrabajadas, horasTrabajadas) || other.horasTrabajadas == horasTrabajadas)&&(identical(other.totalValorizado, totalValorizado) || other.totalValorizado == totalValorizado)&&(identical(other.igvMonto, igvMonto) || other.igvMonto == igvMonto)&&(identical(other.totalConIgv, totalConIgv) || other.totalConIgv == totalConIgv)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.codigoEquipo, codigoEquipo) || other.codigoEquipo == codigoEquipo)&&(identical(other.equipoMarca, equipoMarca) || other.equipoMarca == equipoMarca)&&(identical(other.equipoModelo, equipoModelo) || other.equipoModelo == equipoModelo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,periodo,numeroValorizacion,equipoId,contratoId,fechaInicio,fechaFin,diasTrabajados,horasTrabajadas,totalValorizado,igvMonto,totalConIgv,estado,codigoEquipo,equipoMarca,equipoModelo);

@override
String toString() {
  return 'ValorizationModel(id: $id, periodo: $periodo, numeroValorizacion: $numeroValorizacion, equipoId: $equipoId, contratoId: $contratoId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, diasTrabajados: $diasTrabajados, horasTrabajadas: $horasTrabajadas, totalValorizado: $totalValorizado, igvMonto: $igvMonto, totalConIgv: $totalConIgv, estado: $estado, codigoEquipo: $codigoEquipo, equipoMarca: $equipoMarca, equipoModelo: $equipoModelo)';
}


}

/// @nodoc
abstract mixin class _$ValorizationModelCopyWith<$Res> implements $ValorizationModelCopyWith<$Res> {
  factory _$ValorizationModelCopyWith(_ValorizationModel value, $Res Function(_ValorizationModel) _then) = __$ValorizationModelCopyWithImpl;
@override @useResult
$Res call({
 int id, String periodo,@JsonKey(name: 'numero_valorizacion') String? numeroValorizacion,@JsonKey(name: 'equipo_id') int? equipoId,@JsonKey(name: 'contrato_id') int? contratoId,@JsonKey(name: 'fecha_inicio') String? fechaInicio,@JsonKey(name: 'fecha_fin') String? fechaFin,@JsonKey(name: 'dias_trabajados') int? diasTrabajados,@JsonKey(name: 'horas_trabajadas') double? horasTrabajadas,@JsonKey(name: 'total_valorizado') double totalValorizado,@JsonKey(name: 'igv_monto') double? igvMonto,@JsonKey(name: 'total_con_igv') double totalConIgv, String estado,@JsonKey(name: 'codigo_equipo') String? codigoEquipo,@JsonKey(name: 'equipo_marca') String? equipoMarca,@JsonKey(name: 'equipo_modelo') String? equipoModelo
});




}
/// @nodoc
class __$ValorizationModelCopyWithImpl<$Res>
    implements _$ValorizationModelCopyWith<$Res> {
  __$ValorizationModelCopyWithImpl(this._self, this._then);

  final _ValorizationModel _self;
  final $Res Function(_ValorizationModel) _then;

/// Create a copy of ValorizationModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? periodo = null,Object? numeroValorizacion = freezed,Object? equipoId = freezed,Object? contratoId = freezed,Object? fechaInicio = freezed,Object? fechaFin = freezed,Object? diasTrabajados = freezed,Object? horasTrabajadas = freezed,Object? totalValorizado = null,Object? igvMonto = freezed,Object? totalConIgv = null,Object? estado = null,Object? codigoEquipo = freezed,Object? equipoMarca = freezed,Object? equipoModelo = freezed,}) {
  return _then(_ValorizationModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,periodo: null == periodo ? _self.periodo : periodo // ignore: cast_nullable_to_non_nullable
as String,numeroValorizacion: freezed == numeroValorizacion ? _self.numeroValorizacion : numeroValorizacion // ignore: cast_nullable_to_non_nullable
as String?,equipoId: freezed == equipoId ? _self.equipoId : equipoId // ignore: cast_nullable_to_non_nullable
as int?,contratoId: freezed == contratoId ? _self.contratoId : contratoId // ignore: cast_nullable_to_non_nullable
as int?,fechaInicio: freezed == fechaInicio ? _self.fechaInicio : fechaInicio // ignore: cast_nullable_to_non_nullable
as String?,fechaFin: freezed == fechaFin ? _self.fechaFin : fechaFin // ignore: cast_nullable_to_non_nullable
as String?,diasTrabajados: freezed == diasTrabajados ? _self.diasTrabajados : diasTrabajados // ignore: cast_nullable_to_non_nullable
as int?,horasTrabajadas: freezed == horasTrabajadas ? _self.horasTrabajadas : horasTrabajadas // ignore: cast_nullable_to_non_nullable
as double?,totalValorizado: null == totalValorizado ? _self.totalValorizado : totalValorizado // ignore: cast_nullable_to_non_nullable
as double,igvMonto: freezed == igvMonto ? _self.igvMonto : igvMonto // ignore: cast_nullable_to_non_nullable
as double?,totalConIgv: null == totalConIgv ? _self.totalConIgv : totalConIgv // ignore: cast_nullable_to_non_nullable
as double,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,codigoEquipo: freezed == codigoEquipo ? _self.codigoEquipo : codigoEquipo // ignore: cast_nullable_to_non_nullable
as String?,equipoMarca: freezed == equipoMarca ? _self.equipoMarca : equipoMarca // ignore: cast_nullable_to_non_nullable
as String?,equipoModelo: freezed == equipoModelo ? _self.equipoModelo : equipoModelo // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
