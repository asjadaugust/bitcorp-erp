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

 String get id;@JsonKey(name: 'numero_vale') String get numeroVale;@JsonKey(name: 'fecha') DateTime get fecha;@JsonKey(name: 'tipo_combustible') String get tipoCombustible;@JsonKey(name: 'cantidad_galones') double get cantidadGalones;@JsonKey(name: 'precio_unitario') double? get precioUnitario;@JsonKey(name: 'id_equipo') String get idEquipo;@JsonKey(name: 'foto_path') String get fotoPath;@JsonKey(name: 'notas') String? get notas;@JsonKey(name: 'estado') String get estado;// 'NO_VINCULADO' or 'VINCULADO'
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValeCombustibleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.numeroVale, numeroVale) || other.numeroVale == numeroVale)&&(identical(other.fecha, fecha) || other.fecha == fecha)&&(identical(other.tipoCombustible, tipoCombustible) || other.tipoCombustible == tipoCombustible)&&(identical(other.cantidadGalones, cantidadGalones) || other.cantidadGalones == cantidadGalones)&&(identical(other.precioUnitario, precioUnitario) || other.precioUnitario == precioUnitario)&&(identical(other.idEquipo, idEquipo) || other.idEquipo == idEquipo)&&(identical(other.fotoPath, fotoPath) || other.fotoPath == fotoPath)&&(identical(other.notas, notas) || other.notas == notas)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.syncStatus, syncStatus) || other.syncStatus == syncStatus));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,numeroVale,fecha,tipoCombustible,cantidadGalones,precioUnitario,idEquipo,fotoPath,notas,estado,syncStatus);

@override
String toString() {
  return 'ValeCombustibleModel(id: $id, numeroVale: $numeroVale, fecha: $fecha, tipoCombustible: $tipoCombustible, cantidadGalones: $cantidadGalones, precioUnitario: $precioUnitario, idEquipo: $idEquipo, fotoPath: $fotoPath, notas: $notas, estado: $estado, syncStatus: $syncStatus)';
}


}

/// @nodoc
abstract mixin class $ValeCombustibleModelCopyWith<$Res>  {
  factory $ValeCombustibleModelCopyWith(ValeCombustibleModel value, $Res Function(ValeCombustibleModel) _then) = _$ValeCombustibleModelCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'numero_vale') String numeroVale,@JsonKey(name: 'fecha') DateTime fecha,@JsonKey(name: 'tipo_combustible') String tipoCombustible,@JsonKey(name: 'cantidad_galones') double cantidadGalones,@JsonKey(name: 'precio_unitario') double? precioUnitario,@JsonKey(name: 'id_equipo') String idEquipo,@JsonKey(name: 'foto_path') String fotoPath,@JsonKey(name: 'notas') String? notas,@JsonKey(name: 'estado') String estado,@JsonKey(name: 'sync_status') String syncStatus
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
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? numeroVale = null,Object? fecha = null,Object? tipoCombustible = null,Object? cantidadGalones = null,Object? precioUnitario = freezed,Object? idEquipo = null,Object? fotoPath = null,Object? notas = freezed,Object? estado = null,Object? syncStatus = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,numeroVale: null == numeroVale ? _self.numeroVale : numeroVale // ignore: cast_nullable_to_non_nullable
as String,fecha: null == fecha ? _self.fecha : fecha // ignore: cast_nullable_to_non_nullable
as DateTime,tipoCombustible: null == tipoCombustible ? _self.tipoCombustible : tipoCombustible // ignore: cast_nullable_to_non_nullable
as String,cantidadGalones: null == cantidadGalones ? _self.cantidadGalones : cantidadGalones // ignore: cast_nullable_to_non_nullable
as double,precioUnitario: freezed == precioUnitario ? _self.precioUnitario : precioUnitario // ignore: cast_nullable_to_non_nullable
as double?,idEquipo: null == idEquipo ? _self.idEquipo : idEquipo // ignore: cast_nullable_to_non_nullable
as String,fotoPath: null == fotoPath ? _self.fotoPath : fotoPath // ignore: cast_nullable_to_non_nullable
as String,notas: freezed == notas ? _self.notas : notas // ignore: cast_nullable_to_non_nullable
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'numero_vale')  String numeroVale, @JsonKey(name: 'fecha')  DateTime fecha, @JsonKey(name: 'tipo_combustible')  String tipoCombustible, @JsonKey(name: 'cantidad_galones')  double cantidadGalones, @JsonKey(name: 'precio_unitario')  double? precioUnitario, @JsonKey(name: 'id_equipo')  String idEquipo, @JsonKey(name: 'foto_path')  String fotoPath, @JsonKey(name: 'notas')  String? notas, @JsonKey(name: 'estado')  String estado, @JsonKey(name: 'sync_status')  String syncStatus)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValeCombustibleModel() when $default != null:
return $default(_that.id,_that.numeroVale,_that.fecha,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.idEquipo,_that.fotoPath,_that.notas,_that.estado,_that.syncStatus);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'numero_vale')  String numeroVale, @JsonKey(name: 'fecha')  DateTime fecha, @JsonKey(name: 'tipo_combustible')  String tipoCombustible, @JsonKey(name: 'cantidad_galones')  double cantidadGalones, @JsonKey(name: 'precio_unitario')  double? precioUnitario, @JsonKey(name: 'id_equipo')  String idEquipo, @JsonKey(name: 'foto_path')  String fotoPath, @JsonKey(name: 'notas')  String? notas, @JsonKey(name: 'estado')  String estado, @JsonKey(name: 'sync_status')  String syncStatus)  $default,) {final _that = this;
switch (_that) {
case _ValeCombustibleModel():
return $default(_that.id,_that.numeroVale,_that.fecha,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.idEquipo,_that.fotoPath,_that.notas,_that.estado,_that.syncStatus);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'numero_vale')  String numeroVale, @JsonKey(name: 'fecha')  DateTime fecha, @JsonKey(name: 'tipo_combustible')  String tipoCombustible, @JsonKey(name: 'cantidad_galones')  double cantidadGalones, @JsonKey(name: 'precio_unitario')  double? precioUnitario, @JsonKey(name: 'id_equipo')  String idEquipo, @JsonKey(name: 'foto_path')  String fotoPath, @JsonKey(name: 'notas')  String? notas, @JsonKey(name: 'estado')  String estado, @JsonKey(name: 'sync_status')  String syncStatus)?  $default,) {final _that = this;
switch (_that) {
case _ValeCombustibleModel() when $default != null:
return $default(_that.id,_that.numeroVale,_that.fecha,_that.tipoCombustible,_that.cantidadGalones,_that.precioUnitario,_that.idEquipo,_that.fotoPath,_that.notas,_that.estado,_that.syncStatus);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ValeCombustibleModel implements ValeCombustibleModel {
  const _ValeCombustibleModel({required this.id, @JsonKey(name: 'numero_vale') required this.numeroVale, @JsonKey(name: 'fecha') required this.fecha, @JsonKey(name: 'tipo_combustible') required this.tipoCombustible, @JsonKey(name: 'cantidad_galones') required this.cantidadGalones, @JsonKey(name: 'precio_unitario') this.precioUnitario, @JsonKey(name: 'id_equipo') required this.idEquipo, @JsonKey(name: 'foto_path') required this.fotoPath, @JsonKey(name: 'notas') this.notas, @JsonKey(name: 'estado') this.estado = 'NO_VINCULADO', @JsonKey(name: 'sync_status') this.syncStatus = 'PENDING_SYNC'});
  factory _ValeCombustibleModel.fromJson(Map<String, dynamic> json) => _$ValeCombustibleModelFromJson(json);

@override final  String id;
@override@JsonKey(name: 'numero_vale') final  String numeroVale;
@override@JsonKey(name: 'fecha') final  DateTime fecha;
@override@JsonKey(name: 'tipo_combustible') final  String tipoCombustible;
@override@JsonKey(name: 'cantidad_galones') final  double cantidadGalones;
@override@JsonKey(name: 'precio_unitario') final  double? precioUnitario;
@override@JsonKey(name: 'id_equipo') final  String idEquipo;
@override@JsonKey(name: 'foto_path') final  String fotoPath;
@override@JsonKey(name: 'notas') final  String? notas;
@override@JsonKey(name: 'estado') final  String estado;
// 'NO_VINCULADO' or 'VINCULADO'
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValeCombustibleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.numeroVale, numeroVale) || other.numeroVale == numeroVale)&&(identical(other.fecha, fecha) || other.fecha == fecha)&&(identical(other.tipoCombustible, tipoCombustible) || other.tipoCombustible == tipoCombustible)&&(identical(other.cantidadGalones, cantidadGalones) || other.cantidadGalones == cantidadGalones)&&(identical(other.precioUnitario, precioUnitario) || other.precioUnitario == precioUnitario)&&(identical(other.idEquipo, idEquipo) || other.idEquipo == idEquipo)&&(identical(other.fotoPath, fotoPath) || other.fotoPath == fotoPath)&&(identical(other.notas, notas) || other.notas == notas)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.syncStatus, syncStatus) || other.syncStatus == syncStatus));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,numeroVale,fecha,tipoCombustible,cantidadGalones,precioUnitario,idEquipo,fotoPath,notas,estado,syncStatus);

@override
String toString() {
  return 'ValeCombustibleModel(id: $id, numeroVale: $numeroVale, fecha: $fecha, tipoCombustible: $tipoCombustible, cantidadGalones: $cantidadGalones, precioUnitario: $precioUnitario, idEquipo: $idEquipo, fotoPath: $fotoPath, notas: $notas, estado: $estado, syncStatus: $syncStatus)';
}


}

/// @nodoc
abstract mixin class _$ValeCombustibleModelCopyWith<$Res> implements $ValeCombustibleModelCopyWith<$Res> {
  factory _$ValeCombustibleModelCopyWith(_ValeCombustibleModel value, $Res Function(_ValeCombustibleModel) _then) = __$ValeCombustibleModelCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'numero_vale') String numeroVale,@JsonKey(name: 'fecha') DateTime fecha,@JsonKey(name: 'tipo_combustible') String tipoCombustible,@JsonKey(name: 'cantidad_galones') double cantidadGalones,@JsonKey(name: 'precio_unitario') double? precioUnitario,@JsonKey(name: 'id_equipo') String idEquipo,@JsonKey(name: 'foto_path') String fotoPath,@JsonKey(name: 'notas') String? notas,@JsonKey(name: 'estado') String estado,@JsonKey(name: 'sync_status') String syncStatus
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
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? numeroVale = null,Object? fecha = null,Object? tipoCombustible = null,Object? cantidadGalones = null,Object? precioUnitario = freezed,Object? idEquipo = null,Object? fotoPath = null,Object? notas = freezed,Object? estado = null,Object? syncStatus = null,}) {
  return _then(_ValeCombustibleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,numeroVale: null == numeroVale ? _self.numeroVale : numeroVale // ignore: cast_nullable_to_non_nullable
as String,fecha: null == fecha ? _self.fecha : fecha // ignore: cast_nullable_to_non_nullable
as DateTime,tipoCombustible: null == tipoCombustible ? _self.tipoCombustible : tipoCombustible // ignore: cast_nullable_to_non_nullable
as String,cantidadGalones: null == cantidadGalones ? _self.cantidadGalones : cantidadGalones // ignore: cast_nullable_to_non_nullable
as double,precioUnitario: freezed == precioUnitario ? _self.precioUnitario : precioUnitario // ignore: cast_nullable_to_non_nullable
as double?,idEquipo: null == idEquipo ? _self.idEquipo : idEquipo // ignore: cast_nullable_to_non_nullable
as String,fotoPath: null == fotoPath ? _self.fotoPath : fotoPath // ignore: cast_nullable_to_non_nullable
as String,notas: freezed == notas ? _self.notas : notas // ignore: cast_nullable_to_non_nullable
as String?,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,syncStatus: null == syncStatus ? _self.syncStatus : syncStatus // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
