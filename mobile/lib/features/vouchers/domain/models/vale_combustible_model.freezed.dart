// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'vale_combustible_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ValeCombustibleModel {

@JsonKey(fromJson: _idFromJson) String get id; String? get codigo;@JsonKey(name: 'numero_vale') String get numeroVale;@JsonKey(name: 'fecha') DateTime get fecha;@JsonKey(name: 'tipo_combustible') String get tipoCombustible;@JsonKey(name: 'cantidad_galones') double get cantidadGalones;@JsonKey(name: 'precio_unitario') double? get precioUnitario;@JsonKey(name: 'monto_total') double? get montoTotal;@JsonKey(name: 'equipo_id', fromJson: _idFromJson) String get equipoId;@JsonKey(name: 'foto_path') String? get fotoPath;@JsonKey(name: 'observaciones') String? get observaciones;@JsonKey(name: 'estado') String get estado;// Backend states: PENDIENTE, REGISTRADO, ANULADO
@JsonKey(name: 'sync_status') String get syncStatus;
/// Create a copy of ValeCombustibleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ValeCombustibleModelCopyWith<ValeCombustibleModel> get copyWith => _$ValeCombustibleModelCopyWithImpl<ValeCombustibleModel>(this as ValeCombustibleModel, _$identity);

  /// Serializes this ValeCombustibleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValeCombustibleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.codigo, codigo) || other.codigo == codigo)&&(identical(other.numeroVale, numeroVale) || other.numeroVale == numeroVale)&&(identical(other.fecha, fecha) || other.fecha == fecha)&&(identical(other.tipoCombustible, tipoCombustible) || other.tipoCombustible == tipoCombustible)&&(identical(other.cantidadGalones, cantidadGalones) || other.cantidadGalones == cantidadGalones)&&(identical(other.precioUnitario, precioUnitario) || other.precioUnitario == precioUnitario)&&(identical(other.montoTotal, montoTotal) || other.montoTotal == montoTotal)&&(identical(other.equipoId, equipoId) || other.equipoId == equipoId)&&(identical(other.fotoPath, fotoPath) || other.fotoPath == fotoPath)&&(identical(other.observaciones, observaciones) || other.observaciones == observaciones)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.syncStatus, syncStatus) || other.syncStatus == syncStatus));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,codigo,numeroVale,fecha,tipoCombustible,cantidadGalones,precioUnitario,montoTotal,equipoId,fotoPath,observaciones,estado,syncStatus);

@override
String toString() {
  return 'ValeCombustibleModel(id: $id, codigo: $codigo, numeroVale: $numeroVale, fecha: $fecha, tipoCombustible: $tipoCombustible, cantidadGalones: $cantidadGalones, precioUnitario: $precioUnitario, montoTotal: $montoTotal, equipoId: $equipoId, fotoPath: $fotoPath, observaciones: $observaciones, estado: $estado, syncStatus: $syncStatus)';
}


}

/// @nodoc
abstract mixin class $ValeCombustibleModelCopyWith<$Res>  {
  factory $ValeCombustibleModelCopyWith(ValeCombustibleModel value, $Res Function(ValeCombustibleModel) _then) = _$ValeCombustibleModelCopyWithImpl;
@useResult
$Res call({
@JsonKey(fromJson: _idFromJson) String id, String? codigo,@JsonKey(name: 'numero_vale') String numeroVale,@JsonKey(name: 'fecha') DateTime fecha,@JsonKey(name: 'tipo_combustible') String tipoCombustible,@JsonKey(name: 'cantidad_galones') double cantidadGalones,@JsonKey(name: 'precio_unitario') double? precioUnitario,@JsonKey(name: 'monto_total') double? montoTotal,@JsonKey(name: 'equipo_id', fromJson: _idFromJson) String equipoId,@JsonKey(name: 'foto_path') String? fotoPath,@JsonKey(name: 'observaciones') String? observaciones,@JsonKey(name: 'estado') String estado,@JsonKey(name: 'sync_status') String syncStatus
});




}
/// @nodoc
class _$ValeCombustibleModelCopyWithImpl<$Res>
    implements $ValeCombustibleModelCopyWith<$Res> {
  _$ValeCombustibleModelCopyWithImpl(this._self, this._then);

  final ValeCombustibleModel _self;
  final $Res Function(ValeCombustibleModel) _then;

/// Create a copy of ValeCombustibleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? codigo = freezed,Object? numeroVale = null,Object? fecha = null,Object? tipoCombustible = null,Object? cantidadGalones = null,Object? precioUnitario = freezed,Object? montoTotal = freezed,Object? equipoId = null,Object? fotoPath = freezed,Object? observaciones = freezed,Object? estado = null,Object? syncStatus = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,codigo: freezed == codigo ? _self.codigo : codigo // ignore: cast_nullable_to_non_nullable
as String?,numeroVale: null == numeroVale ? _self.numeroVale : numeroVale // ignore: cast_nullable_to_non_nullable
as String,fecha: null == fecha ? _self.fecha : fecha // ignore: cast_nullable_to_non_nullable
as DateTime,tipoCombustible: null == tipoCombustible ? _self.tipoCombustible : tipoCombustible // ignore: cast_nullable_to_non_nullable
as String,cantidadGalones: null == cantidadGalones ? _self.cantidadGalones : cantidadGalones // ignore: cast_nullable_to_non_nullable
as double,precioUnitario: freezed == precioUnitario ? _self.precioUnitario : precioUnitario // ignore: cast_nullable_to_non_nullable
as double?,montoTotal: freezed == montoTotal ? _self.montoTotal : montoTotal // ignore: cast_nullable_to_non_nullable
as double?,equipoId: null == equipoId ? _self.equipoId : equipoId // ignore: cast_nullable_to_non_nullable
as String,fotoPath: freezed == fotoPath ? _self.fotoPath : fotoPath // ignore: cast_nullable_to_non_nullable
as String?,observaciones: freezed == observaciones ? _self.observaciones : observaciones // ignore: cast_nullable_to_non_nullable
as String?,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,syncStatus: null == syncStatus ? _self.syncStatus : syncStatus // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ValeCombustibleModel].
extension ValeCombustibleModelPatterns on ValeCombustibleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ValeCombustibleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ValeCombustibleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ValeCombustibleModel value)  $default,){
final _that = this;
switch (_that) {
case _ValeCombustibleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ValeCombustibleModel value)?  $default,){
final _that = this;
switch (_that) {
case _ValeCombustibleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(fromJson: _idFromJson)  String id,  String? codigo, @JsonKey(name: 'numero_vale')  String numeroVale, @JsonKey(name: 'fecha')  DateTime fecha, @JsonKey(name: 'tipo_combustible')  String tipoCombustible, @JsonKey(name: 'cantidad_galones')  double cantidadGalones, @JsonKey(name: 'precio_unitario')  double? precioUnitario, @JsonKey(name: 'monto_total')  double? montoTotal, @JsonKey(name: 'equipo_id', fromJson: _idFromJson)  String equipoId, @JsonKey(name: 'foto_path')  String? fotoPath, @JsonKey(name: 'observaciones')  String? observaciones, @JsonKey(name: 'estado')  String estado, @JsonKey(name: 'sync_status')  String syncStatus)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValeCombustibleModel() when $default != null:
return $default(_that.id,_that.codigo,_that.numeroVale,_that.fecha,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.montoTotal,_that.equipoId,_that.fotoPath,_that.observaciones,_that.estado,_that.syncStatus);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(fromJson: _idFromJson)  String id,  String? codigo, @JsonKey(name: 'numero_vale')  String numeroVale, @JsonKey(name: 'fecha')  DateTime fecha, @JsonKey(name: 'tipo_combustible')  String tipoCombustible, @JsonKey(name: 'cantidad_galones')  double cantidadGalones, @JsonKey(name: 'precio_unitario')  double? precioUnitario, @JsonKey(name: 'monto_total')  double? montoTotal, @JsonKey(name: 'equipo_id', fromJson: _idFromJson)  String equipoId, @JsonKey(name: 'foto_path')  String? fotoPath, @JsonKey(name: 'observaciones')  String? observaciones, @JsonKey(name: 'estado')  String estado, @JsonKey(name: 'sync_status')  String syncStatus)  $default,) {final _that = this;
switch (_that) {
case _ValeCombustibleModel():
return $default(_that.id,_that.codigo,_that.numeroVale,_that.fecha,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.montoTotal,_that.equipoId,_that.fotoPath,_that.observaciones,_that.estado,_that.syncStatus);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(fromJson: _idFromJson)  String id,  String? codigo, @JsonKey(name: 'numero_vale')  String numeroVale, @JsonKey(name: 'fecha')  DateTime fecha, @JsonKey(name: 'tipo_combustible')  String tipoCombustible, @JsonKey(name: 'cantidad_galones')  double cantidadGalones, @JsonKey(name: 'precio_unitario')  double? precioUnitario, @JsonKey(name: 'monto_total')  double? montoTotal, @JsonKey(name: 'equipo_id', fromJson: _idFromJson)  String equipoId, @JsonKey(name: 'foto_path')  String? fotoPath, @JsonKey(name: 'observaciones')  String? observaciones, @JsonKey(name: 'estado')  String estado, @JsonKey(name: 'sync_status')  String syncStatus)?  $default,) {final _that = this;
switch (_that) {
case _ValeCombustibleModel() when $default != null:
return $default(_that.id,_that.codigo,_that.numeroVale,_that.fecha,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.montoTotal,_that.equipoId,_that.fotoPath,_that.observaciones,_that.estado,_that.syncStatus);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ValeCombustibleModel implements ValeCombustibleModel {
  const _ValeCombustibleModel({@JsonKey(fromJson: _idFromJson) required this.id, this.codigo, @JsonKey(name: 'numero_vale') required this.numeroVale, @JsonKey(name: 'fecha') required this.fecha, @JsonKey(name: 'tipo_combustible') required this.tipoCombustible, @JsonKey(name: 'cantidad_galones') required this.cantidadGalones, @JsonKey(name: 'precio_unitario') this.precioUnitario, @JsonKey(name: 'monto_total') this.montoTotal, @JsonKey(name: 'equipo_id', fromJson: _idFromJson) required this.equipoId, @JsonKey(name: 'foto_path') this.fotoPath, @JsonKey(name: 'observaciones') this.observaciones, @JsonKey(name: 'estado') this.estado = 'PENDIENTE', @JsonKey(name: 'sync_status') this.syncStatus = 'PENDING_SYNC'});
  factory _ValeCombustibleModel.fromJson(Map<String, dynamic> json) => _$ValeCombustibleModelFromJson(json);

@override@JsonKey(fromJson: _idFromJson) final  String id;
@override final  String? codigo;
@override@JsonKey(name: 'numero_vale') final  String numeroVale;
@override@JsonKey(name: 'fecha') final  DateTime fecha;
@override@JsonKey(name: 'tipo_combustible') final  String tipoCombustible;
@override@JsonKey(name: 'cantidad_galones') final  double cantidadGalones;
@override@JsonKey(name: 'precio_unitario') final  double? precioUnitario;
@override@JsonKey(name: 'monto_total') final  double? montoTotal;
@override@JsonKey(name: 'equipo_id', fromJson: _idFromJson) final  String equipoId;
@override@JsonKey(name: 'foto_path') final  String? fotoPath;
@override@JsonKey(name: 'observaciones') final  String? observaciones;
@override@JsonKey(name: 'estado') final  String estado;
// Backend states: PENDIENTE, REGISTRADO, ANULADO
@override@JsonKey(name: 'sync_status') final  String syncStatus;

/// Create a copy of ValeCombustibleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ValeCombustibleModelCopyWith<_ValeCombustibleModel> get copyWith => __$ValeCombustibleModelCopyWithImpl<_ValeCombustibleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ValeCombustibleModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValeCombustibleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.codigo, codigo) || other.codigo == codigo)&&(identical(other.numeroVale, numeroVale) || other.numeroVale == numeroVale)&&(identical(other.fecha, fecha) || other.fecha == fecha)&&(identical(other.tipoCombustible, tipoCombustible) || other.tipoCombustible == tipoCombustible)&&(identical(other.cantidadGalones, cantidadGalones) || other.cantidadGalones == cantidadGalones)&&(identical(other.precioUnitario, precioUnitario) || other.precioUnitario == precioUnitario)&&(identical(other.montoTotal, montoTotal) || other.montoTotal == montoTotal)&&(identical(other.equipoId, equipoId) || other.equipoId == equipoId)&&(identical(other.fotoPath, fotoPath) || other.fotoPath == fotoPath)&&(identical(other.observaciones, observaciones) || other.observaciones == observaciones)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.syncStatus, syncStatus) || other.syncStatus == syncStatus));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,codigo,numeroVale,fecha,tipoCombustible,cantidadGalones,precioUnitario,montoTotal,equipoId,fotoPath,observaciones,estado,syncStatus);

@override
String toString() {
  return 'ValeCombustibleModel(id: $id, codigo: $codigo, numeroVale: $numeroVale, fecha: $fecha, tipoCombustible: $tipoCombustible, cantidadGalones: $cantidadGalones, precioUnitario: $precioUnitario, montoTotal: $montoTotal, equipoId: $equipoId, fotoPath: $fotoPath, observaciones: $observaciones, estado: $estado, syncStatus: $syncStatus)';
}


}

/// @nodoc
abstract mixin class _$ValeCombustibleModelCopyWith<$Res> implements $ValeCombustibleModelCopyWith<$Res> {
  factory _$ValeCombustibleModelCopyWith(_ValeCombustibleModel value, $Res Function(_ValeCombustibleModel) _then) = __$ValeCombustibleModelCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(fromJson: _idFromJson) String id, String? codigo,@JsonKey(name: 'numero_vale') String numeroVale,@JsonKey(name: 'fecha') DateTime fecha,@JsonKey(name: 'tipo_combustible') String tipoCombustible,@JsonKey(name: 'cantidad_galones') double cantidadGalones,@JsonKey(name: 'precio_unitario') double? precioUnitario,@JsonKey(name: 'monto_total') double? montoTotal,@JsonKey(name: 'equipo_id', fromJson: _idFromJson) String equipoId,@JsonKey(name: 'foto_path') String? fotoPath,@JsonKey(name: 'observaciones') String? observaciones,@JsonKey(name: 'estado') String estado,@JsonKey(name: 'sync_status') String syncStatus
});




}
/// @nodoc
class __$ValeCombustibleModelCopyWithImpl<$Res>
    implements _$ValeCombustibleModelCopyWith<$Res> {
  __$ValeCombustibleModelCopyWithImpl(this._self, this._then);

  final _ValeCombustibleModel _self;
  final $Res Function(_ValeCombustibleModel) _then;

/// Create a copy of ValeCombustibleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? codigo = freezed,Object? numeroVale = null,Object? fecha = null,Object? tipoCombustible = null,Object? cantidadGalones = null,Object? precioUnitario = freezed,Object? montoTotal = freezed,Object? equipoId = null,Object? fotoPath = freezed,Object? observaciones = freezed,Object? estado = null,Object? syncStatus = null,}) {
  return _then(_ValeCombustibleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,codigo: freezed == codigo ? _self.codigo : codigo // ignore: cast_nullable_to_non_nullable
as String?,numeroVale: null == numeroVale ? _self.numeroVale : numeroVale // ignore: cast_nullable_to_non_nullable
as String,fecha: null == fecha ? _self.fecha : fecha // ignore: cast_nullable_to_non_nullable
as DateTime,tipoCombustible: null == tipoCombustible ? _self.tipoCombustible : tipoCombustible // ignore: cast_nullable_to_non_nullable
as String,cantidadGalones: null == cantidadGalones ? _self.cantidadGalones : cantidadGalones // ignore: cast_nullable_to_non_nullable
as double,precioUnitario: freezed == precioUnitario ? _self.precioUnitario : precioUnitario // ignore: cast_nullable_to_non_nullable
as double?,montoTotal: freezed == montoTotal ? _self.montoTotal : montoTotal // ignore: cast_nullable_to_non_nullable
as double?,equipoId: null == equipoId ? _self.equipoId : equipoId // ignore: cast_nullable_to_non_nullable
as String,fotoPath: freezed == fotoPath ? _self.fotoPath : fotoPath // ignore: cast_nullable_to_non_nullable
as String?,observaciones: freezed == observaciones ? _self.observaciones : observaciones // ignore: cast_nullable_to_non_nullable
as String?,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,syncStatus: null == syncStatus ? _self.syncStatus : syncStatus // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
