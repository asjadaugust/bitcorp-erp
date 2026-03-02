// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'equipment_detail_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$EquipmentDetailModel {

 int get id;@JsonKey(name: 'codigo_equipo') String get codigoEquipo; String get marca; String get modelo;@JsonKey(name: 'anio_fabricacion') int? get anioFabricacion; String? get placa; String? get estado;@JsonKey(name: 'tipo_proveedor') String? get tipoProveedor;@JsonKey(name: 'medidor_uso') String? get medidorUso;@JsonKey(name: 'proveedor_razon_social') String? get proveedorRazonSocial;@JsonKey(name: 'tipo_equipo_nombre') String? get tipoEquipoNombre;@JsonKey(name: 'categoria_prd') String? get categoriaPrd;@JsonKey(name: 'fecha_venc_soat') String? get fechaVencSoat;@JsonKey(name: 'fecha_venc_citv') String? get fechaVencCitv;@JsonKey(name: 'fecha_venc_poliza') String? get fechaVencPoliza;
/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EquipmentDetailModelCopyWith<EquipmentDetailModel> get copyWith => _$EquipmentDetailModelCopyWithImpl<EquipmentDetailModel>(this as EquipmentDetailModel, _$identity);

  /// Serializes this EquipmentDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EquipmentDetailModel&&(identical(other.id, id) || other.id == id)&&(identical(other.codigoEquipo, codigoEquipo) || other.codigoEquipo == codigoEquipo)&&(identical(other.marca, marca) || other.marca == marca)&&(identical(other.modelo, modelo) || other.modelo == modelo)&&(identical(other.anioFabricacion, anioFabricacion) || other.anioFabricacion == anioFabricacion)&&(identical(other.placa, placa) || other.placa == placa)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.tipoProveedor, tipoProveedor) || other.tipoProveedor == tipoProveedor)&&(identical(other.medidorUso, medidorUso) || other.medidorUso == medidorUso)&&(identical(other.proveedorRazonSocial, proveedorRazonSocial) || other.proveedorRazonSocial == proveedorRazonSocial)&&(identical(other.tipoEquipoNombre, tipoEquipoNombre) || other.tipoEquipoNombre == tipoEquipoNombre)&&(identical(other.categoriaPrd, categoriaPrd) || other.categoriaPrd == categoriaPrd)&&(identical(other.fechaVencSoat, fechaVencSoat) || other.fechaVencSoat == fechaVencSoat)&&(identical(other.fechaVencCitv, fechaVencCitv) || other.fechaVencCitv == fechaVencCitv)&&(identical(other.fechaVencPoliza, fechaVencPoliza) || other.fechaVencPoliza == fechaVencPoliza));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,codigoEquipo,marca,modelo,anioFabricacion,placa,estado,tipoProveedor,medidorUso,proveedorRazonSocial,tipoEquipoNombre,categoriaPrd,fechaVencSoat,fechaVencCitv,fechaVencPoliza);

@override
String toString() {
  return 'EquipmentDetailModel(id: $id, codigoEquipo: $codigoEquipo, marca: $marca, modelo: $modelo, anioFabricacion: $anioFabricacion, placa: $placa, estado: $estado, tipoProveedor: $tipoProveedor, medidorUso: $medidorUso, proveedorRazonSocial: $proveedorRazonSocial, tipoEquipoNombre: $tipoEquipoNombre, categoriaPrd: $categoriaPrd, fechaVencSoat: $fechaVencSoat, fechaVencCitv: $fechaVencCitv, fechaVencPoliza: $fechaVencPoliza)';
}


}

/// @nodoc
abstract mixin class $EquipmentDetailModelCopyWith<$Res>  {
  factory $EquipmentDetailModelCopyWith(EquipmentDetailModel value, $Res Function(EquipmentDetailModel) _then) = _$EquipmentDetailModelCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'codigo_equipo') String codigoEquipo, String marca, String modelo,@JsonKey(name: 'anio_fabricacion') int? anioFabricacion, String? placa, String? estado,@JsonKey(name: 'tipo_proveedor') String? tipoProveedor,@JsonKey(name: 'medidor_uso') String? medidorUso,@JsonKey(name: 'proveedor_razon_social') String? proveedorRazonSocial,@JsonKey(name: 'tipo_equipo_nombre') String? tipoEquipoNombre,@JsonKey(name: 'categoria_prd') String? categoriaPrd,@JsonKey(name: 'fecha_venc_soat') String? fechaVencSoat,@JsonKey(name: 'fecha_venc_citv') String? fechaVencCitv,@JsonKey(name: 'fecha_venc_poliza') String? fechaVencPoliza
});




}
/// @nodoc
class _$EquipmentDetailModelCopyWithImpl<$Res>
    implements $EquipmentDetailModelCopyWith<$Res> {
  _$EquipmentDetailModelCopyWithImpl(this._self, this._then);

  final EquipmentDetailModel _self;
  final $Res Function(EquipmentDetailModel) _then;

/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? codigoEquipo = null,Object? marca = null,Object? modelo = null,Object? anioFabricacion = freezed,Object? placa = freezed,Object? estado = freezed,Object? tipoProveedor = freezed,Object? medidorUso = freezed,Object? proveedorRazonSocial = freezed,Object? tipoEquipoNombre = freezed,Object? categoriaPrd = freezed,Object? fechaVencSoat = freezed,Object? fechaVencCitv = freezed,Object? fechaVencPoliza = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,codigoEquipo: null == codigoEquipo ? _self.codigoEquipo : codigoEquipo // ignore: cast_nullable_to_non_nullable
as String,marca: null == marca ? _self.marca : marca // ignore: cast_nullable_to_non_nullable
as String,modelo: null == modelo ? _self.modelo : modelo // ignore: cast_nullable_to_non_nullable
as String,anioFabricacion: freezed == anioFabricacion ? _self.anioFabricacion : anioFabricacion // ignore: cast_nullable_to_non_nullable
as int?,placa: freezed == placa ? _self.placa : placa // ignore: cast_nullable_to_non_nullable
as String?,estado: freezed == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String?,tipoProveedor: freezed == tipoProveedor ? _self.tipoProveedor : tipoProveedor // ignore: cast_nullable_to_non_nullable
as String?,medidorUso: freezed == medidorUso ? _self.medidorUso : medidorUso // ignore: cast_nullable_to_non_nullable
as String?,proveedorRazonSocial: freezed == proveedorRazonSocial ? _self.proveedorRazonSocial : proveedorRazonSocial // ignore: cast_nullable_to_non_nullable
as String?,tipoEquipoNombre: freezed == tipoEquipoNombre ? _self.tipoEquipoNombre : tipoEquipoNombre // ignore: cast_nullable_to_non_nullable
as String?,categoriaPrd: freezed == categoriaPrd ? _self.categoriaPrd : categoriaPrd // ignore: cast_nullable_to_non_nullable
as String?,fechaVencSoat: freezed == fechaVencSoat ? _self.fechaVencSoat : fechaVencSoat // ignore: cast_nullable_to_non_nullable
as String?,fechaVencCitv: freezed == fechaVencCitv ? _self.fechaVencCitv : fechaVencCitv // ignore: cast_nullable_to_non_nullable
as String?,fechaVencPoliza: freezed == fechaVencPoliza ? _self.fechaVencPoliza : fechaVencPoliza // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [EquipmentDetailModel].
extension EquipmentDetailModelPatterns on EquipmentDetailModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EquipmentDetailModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EquipmentDetailModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EquipmentDetailModel value)  $default,){
final _that = this;
switch (_that) {
case _EquipmentDetailModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EquipmentDetailModel value)?  $default,){
final _that = this;
switch (_that) {
case _EquipmentDetailModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'codigo_equipo')  String codigoEquipo,  String marca,  String modelo, @JsonKey(name: 'anio_fabricacion')  int? anioFabricacion,  String? placa,  String? estado, @JsonKey(name: 'tipo_proveedor')  String? tipoProveedor, @JsonKey(name: 'medidor_uso')  String? medidorUso, @JsonKey(name: 'proveedor_razon_social')  String? proveedorRazonSocial, @JsonKey(name: 'tipo_equipo_nombre')  String? tipoEquipoNombre, @JsonKey(name: 'categoria_prd')  String? categoriaPrd, @JsonKey(name: 'fecha_venc_soat')  String? fechaVencSoat, @JsonKey(name: 'fecha_venc_citv')  String? fechaVencCitv, @JsonKey(name: 'fecha_venc_poliza')  String? fechaVencPoliza)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EquipmentDetailModel() when $default != null:
return $default(_that.id,_that.codigoEquipo,_that.marca,_that.modelo,_that.anioFabricacion,_that.placa,_that.estado,_that.tipoProveedor,_that.medidorUso,_that.proveedorRazonSocial,_that.tipoEquipoNombre,_that.categoriaPrd,_that.fechaVencSoat,_that.fechaVencCitv,_that.fechaVencPoliza);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'codigo_equipo')  String codigoEquipo,  String marca,  String modelo, @JsonKey(name: 'anio_fabricacion')  int? anioFabricacion,  String? placa,  String? estado, @JsonKey(name: 'tipo_proveedor')  String? tipoProveedor, @JsonKey(name: 'medidor_uso')  String? medidorUso, @JsonKey(name: 'proveedor_razon_social')  String? proveedorRazonSocial, @JsonKey(name: 'tipo_equipo_nombre')  String? tipoEquipoNombre, @JsonKey(name: 'categoria_prd')  String? categoriaPrd, @JsonKey(name: 'fecha_venc_soat')  String? fechaVencSoat, @JsonKey(name: 'fecha_venc_citv')  String? fechaVencCitv, @JsonKey(name: 'fecha_venc_poliza')  String? fechaVencPoliza)  $default,) {final _that = this;
switch (_that) {
case _EquipmentDetailModel():
return $default(_that.id,_that.codigoEquipo,_that.marca,_that.modelo,_that.anioFabricacion,_that.placa,_that.estado,_that.tipoProveedor,_that.medidorUso,_that.proveedorRazonSocial,_that.tipoEquipoNombre,_that.categoriaPrd,_that.fechaVencSoat,_that.fechaVencCitv,_that.fechaVencPoliza);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'codigo_equipo')  String codigoEquipo,  String marca,  String modelo, @JsonKey(name: 'anio_fabricacion')  int? anioFabricacion,  String? placa,  String? estado, @JsonKey(name: 'tipo_proveedor')  String? tipoProveedor, @JsonKey(name: 'medidor_uso')  String? medidorUso, @JsonKey(name: 'proveedor_razon_social')  String? proveedorRazonSocial, @JsonKey(name: 'tipo_equipo_nombre')  String? tipoEquipoNombre, @JsonKey(name: 'categoria_prd')  String? categoriaPrd, @JsonKey(name: 'fecha_venc_soat')  String? fechaVencSoat, @JsonKey(name: 'fecha_venc_citv')  String? fechaVencCitv, @JsonKey(name: 'fecha_venc_poliza')  String? fechaVencPoliza)?  $default,) {final _that = this;
switch (_that) {
case _EquipmentDetailModel() when $default != null:
return $default(_that.id,_that.codigoEquipo,_that.marca,_that.modelo,_that.anioFabricacion,_that.placa,_that.estado,_that.tipoProveedor,_that.medidorUso,_that.proveedorRazonSocial,_that.tipoEquipoNombre,_that.categoriaPrd,_that.fechaVencSoat,_that.fechaVencCitv,_that.fechaVencPoliza);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EquipmentDetailModel extends EquipmentDetailModel {
  const _EquipmentDetailModel({required this.id, @JsonKey(name: 'codigo_equipo') required this.codigoEquipo, required this.marca, required this.modelo, @JsonKey(name: 'anio_fabricacion') this.anioFabricacion, this.placa, this.estado, @JsonKey(name: 'tipo_proveedor') this.tipoProveedor, @JsonKey(name: 'medidor_uso') this.medidorUso, @JsonKey(name: 'proveedor_razon_social') this.proveedorRazonSocial, @JsonKey(name: 'tipo_equipo_nombre') this.tipoEquipoNombre, @JsonKey(name: 'categoria_prd') this.categoriaPrd, @JsonKey(name: 'fecha_venc_soat') this.fechaVencSoat, @JsonKey(name: 'fecha_venc_citv') this.fechaVencCitv, @JsonKey(name: 'fecha_venc_poliza') this.fechaVencPoliza}): super._();
  factory _EquipmentDetailModel.fromJson(Map<String, dynamic> json) => _$EquipmentDetailModelFromJson(json);

@override final  int id;
@override@JsonKey(name: 'codigo_equipo') final  String codigoEquipo;
@override final  String marca;
@override final  String modelo;
@override@JsonKey(name: 'anio_fabricacion') final  int? anioFabricacion;
@override final  String? placa;
@override final  String? estado;
@override@JsonKey(name: 'tipo_proveedor') final  String? tipoProveedor;
@override@JsonKey(name: 'medidor_uso') final  String? medidorUso;
@override@JsonKey(name: 'proveedor_razon_social') final  String? proveedorRazonSocial;
@override@JsonKey(name: 'tipo_equipo_nombre') final  String? tipoEquipoNombre;
@override@JsonKey(name: 'categoria_prd') final  String? categoriaPrd;
@override@JsonKey(name: 'fecha_venc_soat') final  String? fechaVencSoat;
@override@JsonKey(name: 'fecha_venc_citv') final  String? fechaVencCitv;
@override@JsonKey(name: 'fecha_venc_poliza') final  String? fechaVencPoliza;

/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EquipmentDetailModelCopyWith<_EquipmentDetailModel> get copyWith => __$EquipmentDetailModelCopyWithImpl<_EquipmentDetailModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EquipmentDetailModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EquipmentDetailModel&&(identical(other.id, id) || other.id == id)&&(identical(other.codigoEquipo, codigoEquipo) || other.codigoEquipo == codigoEquipo)&&(identical(other.marca, marca) || other.marca == marca)&&(identical(other.modelo, modelo) || other.modelo == modelo)&&(identical(other.anioFabricacion, anioFabricacion) || other.anioFabricacion == anioFabricacion)&&(identical(other.placa, placa) || other.placa == placa)&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.tipoProveedor, tipoProveedor) || other.tipoProveedor == tipoProveedor)&&(identical(other.medidorUso, medidorUso) || other.medidorUso == medidorUso)&&(identical(other.proveedorRazonSocial, proveedorRazonSocial) || other.proveedorRazonSocial == proveedorRazonSocial)&&(identical(other.tipoEquipoNombre, tipoEquipoNombre) || other.tipoEquipoNombre == tipoEquipoNombre)&&(identical(other.categoriaPrd, categoriaPrd) || other.categoriaPrd == categoriaPrd)&&(identical(other.fechaVencSoat, fechaVencSoat) || other.fechaVencSoat == fechaVencSoat)&&(identical(other.fechaVencCitv, fechaVencCitv) || other.fechaVencCitv == fechaVencCitv)&&(identical(other.fechaVencPoliza, fechaVencPoliza) || other.fechaVencPoliza == fechaVencPoliza));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,codigoEquipo,marca,modelo,anioFabricacion,placa,estado,tipoProveedor,medidorUso,proveedorRazonSocial,tipoEquipoNombre,categoriaPrd,fechaVencSoat,fechaVencCitv,fechaVencPoliza);

@override
String toString() {
  return 'EquipmentDetailModel(id: $id, codigoEquipo: $codigoEquipo, marca: $marca, modelo: $modelo, anioFabricacion: $anioFabricacion, placa: $placa, estado: $estado, tipoProveedor: $tipoProveedor, medidorUso: $medidorUso, proveedorRazonSocial: $proveedorRazonSocial, tipoEquipoNombre: $tipoEquipoNombre, categoriaPrd: $categoriaPrd, fechaVencSoat: $fechaVencSoat, fechaVencCitv: $fechaVencCitv, fechaVencPoliza: $fechaVencPoliza)';
}


}

/// @nodoc
abstract mixin class _$EquipmentDetailModelCopyWith<$Res> implements $EquipmentDetailModelCopyWith<$Res> {
  factory _$EquipmentDetailModelCopyWith(_EquipmentDetailModel value, $Res Function(_EquipmentDetailModel) _then) = __$EquipmentDetailModelCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'codigo_equipo') String codigoEquipo, String marca, String modelo,@JsonKey(name: 'anio_fabricacion') int? anioFabricacion, String? placa, String? estado,@JsonKey(name: 'tipo_proveedor') String? tipoProveedor,@JsonKey(name: 'medidor_uso') String? medidorUso,@JsonKey(name: 'proveedor_razon_social') String? proveedorRazonSocial,@JsonKey(name: 'tipo_equipo_nombre') String? tipoEquipoNombre,@JsonKey(name: 'categoria_prd') String? categoriaPrd,@JsonKey(name: 'fecha_venc_soat') String? fechaVencSoat,@JsonKey(name: 'fecha_venc_citv') String? fechaVencCitv,@JsonKey(name: 'fecha_venc_poliza') String? fechaVencPoliza
});




}
/// @nodoc
class __$EquipmentDetailModelCopyWithImpl<$Res>
    implements _$EquipmentDetailModelCopyWith<$Res> {
  __$EquipmentDetailModelCopyWithImpl(this._self, this._then);

  final _EquipmentDetailModel _self;
  final $Res Function(_EquipmentDetailModel) _then;

/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? codigoEquipo = null,Object? marca = null,Object? modelo = null,Object? anioFabricacion = freezed,Object? placa = freezed,Object? estado = freezed,Object? tipoProveedor = freezed,Object? medidorUso = freezed,Object? proveedorRazonSocial = freezed,Object? tipoEquipoNombre = freezed,Object? categoriaPrd = freezed,Object? fechaVencSoat = freezed,Object? fechaVencCitv = freezed,Object? fechaVencPoliza = freezed,}) {
  return _then(_EquipmentDetailModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,codigoEquipo: null == codigoEquipo ? _self.codigoEquipo : codigoEquipo // ignore: cast_nullable_to_non_nullable
as String,marca: null == marca ? _self.marca : marca // ignore: cast_nullable_to_non_nullable
as String,modelo: null == modelo ? _self.modelo : modelo // ignore: cast_nullable_to_non_nullable
as String,anioFabricacion: freezed == anioFabricacion ? _self.anioFabricacion : anioFabricacion // ignore: cast_nullable_to_non_nullable
as int?,placa: freezed == placa ? _self.placa : placa // ignore: cast_nullable_to_non_nullable
as String?,estado: freezed == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String?,tipoProveedor: freezed == tipoProveedor ? _self.tipoProveedor : tipoProveedor // ignore: cast_nullable_to_non_nullable
as String?,medidorUso: freezed == medidorUso ? _self.medidorUso : medidorUso // ignore: cast_nullable_to_non_nullable
as String?,proveedorRazonSocial: freezed == proveedorRazonSocial ? _self.proveedorRazonSocial : proveedorRazonSocial // ignore: cast_nullable_to_non_nullable
as String?,tipoEquipoNombre: freezed == tipoEquipoNombre ? _self.tipoEquipoNombre : tipoEquipoNombre // ignore: cast_nullable_to_non_nullable
as String?,categoriaPrd: freezed == categoriaPrd ? _self.categoriaPrd : categoriaPrd // ignore: cast_nullable_to_non_nullable
as String?,fechaVencSoat: freezed == fechaVencSoat ? _self.fechaVencSoat : fechaVencSoat // ignore: cast_nullable_to_non_nullable
as String?,fechaVencCitv: freezed == fechaVencCitv ? _self.fechaVencCitv : fechaVencCitv // ignore: cast_nullable_to_non_nullable
as String?,fechaVencPoliza: freezed == fechaVencPoliza ? _self.fechaVencPoliza : fechaVencPoliza // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

/// @nodoc
mixin _$DocumentComplianceModel {

 String get tipo; String get fechaVencimiento; String get estado;
/// Create a copy of DocumentComplianceModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DocumentComplianceModelCopyWith<DocumentComplianceModel> get copyWith => _$DocumentComplianceModelCopyWithImpl<DocumentComplianceModel>(this as DocumentComplianceModel, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DocumentComplianceModel&&(identical(other.tipo, tipo) || other.tipo == tipo)&&(identical(other.fechaVencimiento, fechaVencimiento) || other.fechaVencimiento == fechaVencimiento)&&(identical(other.estado, estado) || other.estado == estado));
}


@override
int get hashCode => Object.hash(runtimeType,tipo,fechaVencimiento,estado);

@override
String toString() {
  return 'DocumentComplianceModel(tipo: $tipo, fechaVencimiento: $fechaVencimiento, estado: $estado)';
}


}

/// @nodoc
abstract mixin class $DocumentComplianceModelCopyWith<$Res>  {
  factory $DocumentComplianceModelCopyWith(DocumentComplianceModel value, $Res Function(DocumentComplianceModel) _then) = _$DocumentComplianceModelCopyWithImpl;
@useResult
$Res call({
 String tipo, String fechaVencimiento, String estado
});




}
/// @nodoc
class _$DocumentComplianceModelCopyWithImpl<$Res>
    implements $DocumentComplianceModelCopyWith<$Res> {
  _$DocumentComplianceModelCopyWithImpl(this._self, this._then);

  final DocumentComplianceModel _self;
  final $Res Function(DocumentComplianceModel) _then;

/// Create a copy of DocumentComplianceModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tipo = null,Object? fechaVencimiento = null,Object? estado = null,}) {
  return _then(_self.copyWith(
tipo: null == tipo ? _self.tipo : tipo // ignore: cast_nullable_to_non_nullable
as String,fechaVencimiento: null == fechaVencimiento ? _self.fechaVencimiento : fechaVencimiento // ignore: cast_nullable_to_non_nullable
as String,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [DocumentComplianceModel].
extension DocumentComplianceModelPatterns on DocumentComplianceModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DocumentComplianceModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DocumentComplianceModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DocumentComplianceModel value)  $default,){
final _that = this;
switch (_that) {
case _DocumentComplianceModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DocumentComplianceModel value)?  $default,){
final _that = this;
switch (_that) {
case _DocumentComplianceModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String tipo,  String fechaVencimiento,  String estado)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DocumentComplianceModel() when $default != null:
return $default(_that.tipo,_that.fechaVencimiento,_that.estado);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String tipo,  String fechaVencimiento,  String estado)  $default,) {final _that = this;
switch (_that) {
case _DocumentComplianceModel():
return $default(_that.tipo,_that.fechaVencimiento,_that.estado);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String tipo,  String fechaVencimiento,  String estado)?  $default,) {final _that = this;
switch (_that) {
case _DocumentComplianceModel() when $default != null:
return $default(_that.tipo,_that.fechaVencimiento,_that.estado);case _:
  return null;

}
}

}

/// @nodoc


class _DocumentComplianceModel implements DocumentComplianceModel {
  const _DocumentComplianceModel({required this.tipo, required this.fechaVencimiento, required this.estado});
  

@override final  String tipo;
@override final  String fechaVencimiento;
@override final  String estado;

/// Create a copy of DocumentComplianceModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DocumentComplianceModelCopyWith<_DocumentComplianceModel> get copyWith => __$DocumentComplianceModelCopyWithImpl<_DocumentComplianceModel>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DocumentComplianceModel&&(identical(other.tipo, tipo) || other.tipo == tipo)&&(identical(other.fechaVencimiento, fechaVencimiento) || other.fechaVencimiento == fechaVencimiento)&&(identical(other.estado, estado) || other.estado == estado));
}


@override
int get hashCode => Object.hash(runtimeType,tipo,fechaVencimiento,estado);

@override
String toString() {
  return 'DocumentComplianceModel(tipo: $tipo, fechaVencimiento: $fechaVencimiento, estado: $estado)';
}


}

/// @nodoc
abstract mixin class _$DocumentComplianceModelCopyWith<$Res> implements $DocumentComplianceModelCopyWith<$Res> {
  factory _$DocumentComplianceModelCopyWith(_DocumentComplianceModel value, $Res Function(_DocumentComplianceModel) _then) = __$DocumentComplianceModelCopyWithImpl;
@override @useResult
$Res call({
 String tipo, String fechaVencimiento, String estado
});




}
/// @nodoc
class __$DocumentComplianceModelCopyWithImpl<$Res>
    implements _$DocumentComplianceModelCopyWith<$Res> {
  __$DocumentComplianceModelCopyWithImpl(this._self, this._then);

  final _DocumentComplianceModel _self;
  final $Res Function(_DocumentComplianceModel) _then;

/// Create a copy of DocumentComplianceModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tipo = null,Object? fechaVencimiento = null,Object? estado = null,}) {
  return _then(_DocumentComplianceModel(
tipo: null == tipo ? _self.tipo : tipo // ignore: cast_nullable_to_non_nullable
as String,fechaVencimiento: null == fechaVencimiento ? _self.fechaVencimiento : fechaVencimiento // ignore: cast_nullable_to_non_nullable
as String,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
