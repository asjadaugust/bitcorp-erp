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

 String get id; String get codigo; String get descripcion; String get marca; String get modelo; int get anio; String get placa; ContractModel get contrato; List<DocumentComplianceModel> get documentos;
/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EquipmentDetailModelCopyWith<EquipmentDetailModel> get copyWith => _$EquipmentDetailModelCopyWithImpl<EquipmentDetailModel>(this as EquipmentDetailModel, _$identity);

  /// Serializes this EquipmentDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EquipmentDetailModel&&(identical(other.id, id) || other.id == id)&&(identical(other.codigo, codigo) || other.codigo == codigo)&&(identical(other.descripcion, descripcion) || other.descripcion == descripcion)&&(identical(other.marca, marca) || other.marca == marca)&&(identical(other.modelo, modelo) || other.modelo == modelo)&&(identical(other.anio, anio) || other.anio == anio)&&(identical(other.placa, placa) || other.placa == placa)&&(identical(other.contrato, contrato) || other.contrato == contrato)&&const DeepCollectionEquality().equals(other.documentos, documentos));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,codigo,descripcion,marca,modelo,anio,placa,contrato,const DeepCollectionEquality().hash(documentos));

@override
String toString() {
  return 'EquipmentDetailModel(id: $id, codigo: $codigo, descripcion: $descripcion, marca: $marca, modelo: $modelo, anio: $anio, placa: $placa, contrato: $contrato, documentos: $documentos)';
}


}

/// @nodoc
abstract mixin class $EquipmentDetailModelCopyWith<$Res>  {
  factory $EquipmentDetailModelCopyWith(EquipmentDetailModel value, $Res Function(EquipmentDetailModel) _then) = _$EquipmentDetailModelCopyWithImpl;
@useResult
$Res call({
 String id, String codigo, String descripcion, String marca, String modelo, int anio, String placa, ContractModel contrato, List<DocumentComplianceModel> documentos
});


$ContractModelCopyWith<$Res> get contrato;

}
/// @nodoc
class _$EquipmentDetailModelCopyWithImpl<$Res>
    implements $EquipmentDetailModelCopyWith<$Res> {
  _$EquipmentDetailModelCopyWithImpl(this._self, this._then);

  final EquipmentDetailModel _self;
  final $Res Function(EquipmentDetailModel) _then;

/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? codigo = null,Object? descripcion = null,Object? marca = null,Object? modelo = null,Object? anio = null,Object? placa = null,Object? contrato = null,Object? documentos = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,codigo: null == codigo ? _self.codigo : codigo // ignore: cast_nullable_to_non_nullable
as String,descripcion: null == descripcion ? _self.descripcion : descripcion // ignore: cast_nullable_to_non_nullable
as String,marca: null == marca ? _self.marca : marca // ignore: cast_nullable_to_non_nullable
as String,modelo: null == modelo ? _self.modelo : modelo // ignore: cast_nullable_to_non_nullable
as String,anio: null == anio ? _self.anio : anio // ignore: cast_nullable_to_non_nullable
as int,placa: null == placa ? _self.placa : placa // ignore: cast_nullable_to_non_nullable
as String,contrato: null == contrato ? _self.contrato : contrato // ignore: cast_nullable_to_non_nullable
as ContractModel,documentos: null == documentos ? _self.documentos : documentos // ignore: cast_nullable_to_non_nullable
as List<DocumentComplianceModel>,
  ));
}
/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContractModelCopyWith<$Res> get contrato {
  
  return $ContractModelCopyWith<$Res>(_self.contrato, (value) {
    return _then(_self.copyWith(contrato: value));
  });
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String codigo,  String descripcion,  String marca,  String modelo,  int anio,  String placa,  ContractModel contrato,  List<DocumentComplianceModel> documentos)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EquipmentDetailModel() when $default != null:
return $default(_that.id,_that.codigo,_that.descripcion,_that.marca,_that.modelo,_that.anio,_that.placa,_that.contrato,_that.documentos);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String codigo,  String descripcion,  String marca,  String modelo,  int anio,  String placa,  ContractModel contrato,  List<DocumentComplianceModel> documentos)  $default,) {final _that = this;
switch (_that) {
case _EquipmentDetailModel():
return $default(_that.id,_that.codigo,_that.descripcion,_that.marca,_that.modelo,_that.anio,_that.placa,_that.contrato,_that.documentos);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String codigo,  String descripcion,  String marca,  String modelo,  int anio,  String placa,  ContractModel contrato,  List<DocumentComplianceModel> documentos)?  $default,) {final _that = this;
switch (_that) {
case _EquipmentDetailModel() when $default != null:
return $default(_that.id,_that.codigo,_that.descripcion,_that.marca,_that.modelo,_that.anio,_that.placa,_that.contrato,_that.documentos);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EquipmentDetailModel implements EquipmentDetailModel {
  const _EquipmentDetailModel({required this.id, required this.codigo, required this.descripcion, required this.marca, required this.modelo, required this.anio, required this.placa, required this.contrato, required final  List<DocumentComplianceModel> documentos}): _documentos = documentos;
  factory _EquipmentDetailModel.fromJson(Map<String, dynamic> json) => _$EquipmentDetailModelFromJson(json);

@override final  String id;
@override final  String codigo;
@override final  String descripcion;
@override final  String marca;
@override final  String modelo;
@override final  int anio;
@override final  String placa;
@override final  ContractModel contrato;
 final  List<DocumentComplianceModel> _documentos;
@override List<DocumentComplianceModel> get documentos {
  if (_documentos is EqualUnmodifiableListView) return _documentos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_documentos);
}


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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EquipmentDetailModel&&(identical(other.id, id) || other.id == id)&&(identical(other.codigo, codigo) || other.codigo == codigo)&&(identical(other.descripcion, descripcion) || other.descripcion == descripcion)&&(identical(other.marca, marca) || other.marca == marca)&&(identical(other.modelo, modelo) || other.modelo == modelo)&&(identical(other.anio, anio) || other.anio == anio)&&(identical(other.placa, placa) || other.placa == placa)&&(identical(other.contrato, contrato) || other.contrato == contrato)&&const DeepCollectionEquality().equals(other._documentos, _documentos));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,codigo,descripcion,marca,modelo,anio,placa,contrato,const DeepCollectionEquality().hash(_documentos));

@override
String toString() {
  return 'EquipmentDetailModel(id: $id, codigo: $codigo, descripcion: $descripcion, marca: $marca, modelo: $modelo, anio: $anio, placa: $placa, contrato: $contrato, documentos: $documentos)';
}


}

/// @nodoc
abstract mixin class _$EquipmentDetailModelCopyWith<$Res> implements $EquipmentDetailModelCopyWith<$Res> {
  factory _$EquipmentDetailModelCopyWith(_EquipmentDetailModel value, $Res Function(_EquipmentDetailModel) _then) = __$EquipmentDetailModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String codigo, String descripcion, String marca, String modelo, int anio, String placa, ContractModel contrato, List<DocumentComplianceModel> documentos
});


@override $ContractModelCopyWith<$Res> get contrato;

}
/// @nodoc
class __$EquipmentDetailModelCopyWithImpl<$Res>
    implements _$EquipmentDetailModelCopyWith<$Res> {
  __$EquipmentDetailModelCopyWithImpl(this._self, this._then);

  final _EquipmentDetailModel _self;
  final $Res Function(_EquipmentDetailModel) _then;

/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? codigo = null,Object? descripcion = null,Object? marca = null,Object? modelo = null,Object? anio = null,Object? placa = null,Object? contrato = null,Object? documentos = null,}) {
  return _then(_EquipmentDetailModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,codigo: null == codigo ? _self.codigo : codigo // ignore: cast_nullable_to_non_nullable
as String,descripcion: null == descripcion ? _self.descripcion : descripcion // ignore: cast_nullable_to_non_nullable
as String,marca: null == marca ? _self.marca : marca // ignore: cast_nullable_to_non_nullable
as String,modelo: null == modelo ? _self.modelo : modelo // ignore: cast_nullable_to_non_nullable
as String,anio: null == anio ? _self.anio : anio // ignore: cast_nullable_to_non_nullable
as int,placa: null == placa ? _self.placa : placa // ignore: cast_nullable_to_non_nullable
as String,contrato: null == contrato ? _self.contrato : contrato // ignore: cast_nullable_to_non_nullable
as ContractModel,documentos: null == documentos ? _self._documentos : documentos // ignore: cast_nullable_to_non_nullable
as List<DocumentComplianceModel>,
  ));
}

/// Create a copy of EquipmentDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContractModelCopyWith<$Res> get contrato {
  
  return $ContractModelCopyWith<$Res>(_self.contrato, (value) {
    return _then(_self.copyWith(contrato: value));
  });
}
}


/// @nodoc
mixin _$ContractModel {

 String get estado;@JsonKey(name: 'tipo_tarifa') String get tipoTarifa;@JsonKey(name: 'anexo_a') List<String> get anexoA;
/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContractModelCopyWith<ContractModel> get copyWith => _$ContractModelCopyWithImpl<ContractModel>(this as ContractModel, _$identity);

  /// Serializes this ContractModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContractModel&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.tipoTarifa, tipoTarifa) || other.tipoTarifa == tipoTarifa)&&const DeepCollectionEquality().equals(other.anexoA, anexoA));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,estado,tipoTarifa,const DeepCollectionEquality().hash(anexoA));

@override
String toString() {
  return 'ContractModel(estado: $estado, tipoTarifa: $tipoTarifa, anexoA: $anexoA)';
}


}

/// @nodoc
abstract mixin class $ContractModelCopyWith<$Res>  {
  factory $ContractModelCopyWith(ContractModel value, $Res Function(ContractModel) _then) = _$ContractModelCopyWithImpl;
@useResult
$Res call({
 String estado,@JsonKey(name: 'tipo_tarifa') String tipoTarifa,@JsonKey(name: 'anexo_a') List<String> anexoA
});




}
/// @nodoc
class _$ContractModelCopyWithImpl<$Res>
    implements $ContractModelCopyWith<$Res> {
  _$ContractModelCopyWithImpl(this._self, this._then);

  final ContractModel _self;
  final $Res Function(ContractModel) _then;

/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? estado = null,Object? tipoTarifa = null,Object? anexoA = null,}) {
  return _then(_self.copyWith(
estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,tipoTarifa: null == tipoTarifa ? _self.tipoTarifa : tipoTarifa // ignore: cast_nullable_to_non_nullable
as String,anexoA: null == anexoA ? _self.anexoA : anexoA // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ContractModel].
extension ContractModelPatterns on ContractModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContractModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContractModel value)  $default,){
final _that = this;
switch (_that) {
case _ContractModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContractModel value)?  $default,){
final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String estado, @JsonKey(name: 'tipo_tarifa')  String tipoTarifa, @JsonKey(name: 'anexo_a')  List<String> anexoA)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
return $default(_that.estado,_that.tipoTarifa,_that.anexoA);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String estado, @JsonKey(name: 'tipo_tarifa')  String tipoTarifa, @JsonKey(name: 'anexo_a')  List<String> anexoA)  $default,) {final _that = this;
switch (_that) {
case _ContractModel():
return $default(_that.estado,_that.tipoTarifa,_that.anexoA);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String estado, @JsonKey(name: 'tipo_tarifa')  String tipoTarifa, @JsonKey(name: 'anexo_a')  List<String> anexoA)?  $default,) {final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
return $default(_that.estado,_that.tipoTarifa,_that.anexoA);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContractModel implements ContractModel {
  const _ContractModel({required this.estado, @JsonKey(name: 'tipo_tarifa') required this.tipoTarifa, @JsonKey(name: 'anexo_a') required final  List<String> anexoA}): _anexoA = anexoA;
  factory _ContractModel.fromJson(Map<String, dynamic> json) => _$ContractModelFromJson(json);

@override final  String estado;
@override@JsonKey(name: 'tipo_tarifa') final  String tipoTarifa;
 final  List<String> _anexoA;
@override@JsonKey(name: 'anexo_a') List<String> get anexoA {
  if (_anexoA is EqualUnmodifiableListView) return _anexoA;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_anexoA);
}


/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContractModelCopyWith<_ContractModel> get copyWith => __$ContractModelCopyWithImpl<_ContractModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContractModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContractModel&&(identical(other.estado, estado) || other.estado == estado)&&(identical(other.tipoTarifa, tipoTarifa) || other.tipoTarifa == tipoTarifa)&&const DeepCollectionEquality().equals(other._anexoA, _anexoA));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,estado,tipoTarifa,const DeepCollectionEquality().hash(_anexoA));

@override
String toString() {
  return 'ContractModel(estado: $estado, tipoTarifa: $tipoTarifa, anexoA: $anexoA)';
}


}

/// @nodoc
abstract mixin class _$ContractModelCopyWith<$Res> implements $ContractModelCopyWith<$Res> {
  factory _$ContractModelCopyWith(_ContractModel value, $Res Function(_ContractModel) _then) = __$ContractModelCopyWithImpl;
@override @useResult
$Res call({
 String estado,@JsonKey(name: 'tipo_tarifa') String tipoTarifa,@JsonKey(name: 'anexo_a') List<String> anexoA
});




}
/// @nodoc
class __$ContractModelCopyWithImpl<$Res>
    implements _$ContractModelCopyWith<$Res> {
  __$ContractModelCopyWithImpl(this._self, this._then);

  final _ContractModel _self;
  final $Res Function(_ContractModel) _then;

/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? estado = null,Object? tipoTarifa = null,Object? anexoA = null,}) {
  return _then(_ContractModel(
estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,tipoTarifa: null == tipoTarifa ? _self.tipoTarifa : tipoTarifa // ignore: cast_nullable_to_non_nullable
as String,anexoA: null == anexoA ? _self._anexoA : anexoA // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}


/// @nodoc
mixin _$DocumentComplianceModel {

 String get tipo;@JsonKey(name: 'fecha_vencimiento') DateTime get fechaVencimiento; String get estado;
/// Create a copy of DocumentComplianceModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DocumentComplianceModelCopyWith<DocumentComplianceModel> get copyWith => _$DocumentComplianceModelCopyWithImpl<DocumentComplianceModel>(this as DocumentComplianceModel, _$identity);

  /// Serializes this DocumentComplianceModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DocumentComplianceModel&&(identical(other.tipo, tipo) || other.tipo == tipo)&&(identical(other.fechaVencimiento, fechaVencimiento) || other.fechaVencimiento == fechaVencimiento)&&(identical(other.estado, estado) || other.estado == estado));
}

@JsonKey(includeFromJson: false, includeToJson: false)
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
 String tipo,@JsonKey(name: 'fecha_vencimiento') DateTime fechaVencimiento, String estado
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
as DateTime,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String tipo, @JsonKey(name: 'fecha_vencimiento')  DateTime fechaVencimiento,  String estado)?  $default,{required TResult orElse(),}) {final _that = this;
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String tipo, @JsonKey(name: 'fecha_vencimiento')  DateTime fechaVencimiento,  String estado)  $default,) {final _that = this;
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String tipo, @JsonKey(name: 'fecha_vencimiento')  DateTime fechaVencimiento,  String estado)?  $default,) {final _that = this;
switch (_that) {
case _DocumentComplianceModel() when $default != null:
return $default(_that.tipo,_that.fechaVencimiento,_that.estado);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DocumentComplianceModel implements DocumentComplianceModel {
  const _DocumentComplianceModel({required this.tipo, @JsonKey(name: 'fecha_vencimiento') required this.fechaVencimiento, required this.estado});
  factory _DocumentComplianceModel.fromJson(Map<String, dynamic> json) => _$DocumentComplianceModelFromJson(json);

@override final  String tipo;
@override@JsonKey(name: 'fecha_vencimiento') final  DateTime fechaVencimiento;
@override final  String estado;

/// Create a copy of DocumentComplianceModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DocumentComplianceModelCopyWith<_DocumentComplianceModel> get copyWith => __$DocumentComplianceModelCopyWithImpl<_DocumentComplianceModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DocumentComplianceModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DocumentComplianceModel&&(identical(other.tipo, tipo) || other.tipo == tipo)&&(identical(other.fechaVencimiento, fechaVencimiento) || other.fechaVencimiento == fechaVencimiento)&&(identical(other.estado, estado) || other.estado == estado));
}

@JsonKey(includeFromJson: false, includeToJson: false)
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
 String tipo,@JsonKey(name: 'fecha_vencimiento') DateTime fechaVencimiento, String estado
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
as DateTime,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
