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

 String get id; String get periodo;@JsonKey(name: 'monto_bruto') double get montoBruto; Map<String, double> get deducciones;@JsonKey(name: 'monto_neto') double get montoNeto; String get estado;
/// Create a copy of ValorizationModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ValorizationModelCopyWith<ValorizationModel> get copyWith => _$ValorizationModelCopyWithImpl<ValorizationModel>(this as ValorizationModel, _$identity);

  /// Serializes this ValorizationModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValorizationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.periodo, periodo) || other.periodo == periodo)&&(identical(other.montoBruto, montoBruto) || other.montoBruto == montoBruto)&&const DeepCollectionEquality().equals(other.deducciones, deducciones)&&(identical(other.montoNeto, montoNeto) || other.montoNeto == montoNeto)&&(identical(other.estado, estado) || other.estado == estado));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,periodo,montoBruto,const DeepCollectionEquality().hash(deducciones),montoNeto,estado);

@override
String toString() {
  return 'ValorizationModel(id: $id, periodo: $periodo, montoBruto: $montoBruto, deducciones: $deducciones, montoNeto: $montoNeto, estado: $estado)';
}


}

/// @nodoc
abstract mixin class $ValorizationModelCopyWith<$Res>  {
  factory $ValorizationModelCopyWith(ValorizationModel value, $Res Function(ValorizationModel) _then) = _$ValorizationModelCopyWithImpl;
@useResult
$Res call({
 String id, String periodo,@JsonKey(name: 'monto_bruto') double montoBruto, Map<String, double> deducciones,@JsonKey(name: 'monto_neto') double montoNeto, String estado
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
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? periodo = null,Object? montoBruto = null,Object? deducciones = null,Object? montoNeto = null,Object? estado = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,periodo: null == periodo ? _self.periodo : periodo // ignore: cast_nullable_to_non_nullable
as String,montoBruto: null == montoBruto ? _self.montoBruto : montoBruto // ignore: cast_nullable_to_non_nullable
as double,deducciones: null == deducciones ? _self.deducciones : deducciones // ignore: cast_nullable_to_non_nullable
as Map<String, double>,montoNeto: null == montoNeto ? _self.montoNeto : montoNeto // ignore: cast_nullable_to_non_nullable
as double,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String periodo, @JsonKey(name: 'monto_bruto')  double montoBruto,  Map<String, double> deducciones, @JsonKey(name: 'monto_neto')  double montoNeto,  String estado)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValorizationModel() when $default != null:
return $default(_that.id,_that.periodo,_that.montoBruto,_that.deducciones,_that.montoNeto,_that.estado);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String periodo, @JsonKey(name: 'monto_bruto')  double montoBruto,  Map<String, double> deducciones, @JsonKey(name: 'monto_neto')  double montoNeto,  String estado)  $default,) {final _that = this;
switch (_that) {
case _ValorizationModel():
return $default(_that.id,_that.periodo,_that.montoBruto,_that.deducciones,_that.montoNeto,_that.estado);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String periodo, @JsonKey(name: 'monto_bruto')  double montoBruto,  Map<String, double> deducciones, @JsonKey(name: 'monto_neto')  double montoNeto,  String estado)?  $default,) {final _that = this;
switch (_that) {
case _ValorizationModel() when $default != null:
return $default(_that.id,_that.periodo,_that.montoBruto,_that.deducciones,_that.montoNeto,_that.estado);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ValorizationModel implements ValorizationModel {
  const _ValorizationModel({required this.id, required this.periodo, @JsonKey(name: 'monto_bruto') required this.montoBruto, required final  Map<String, double> deducciones, @JsonKey(name: 'monto_neto') required this.montoNeto, required this.estado}): _deducciones = deducciones;
  factory _ValorizationModel.fromJson(Map<String, dynamic> json) => _$ValorizationModelFromJson(json);

@override final  String id;
@override final  String periodo;
@override@JsonKey(name: 'monto_bruto') final  double montoBruto;
 final  Map<String, double> _deducciones;
@override Map<String, double> get deducciones {
  if (_deducciones is EqualUnmodifiableMapView) return _deducciones;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_deducciones);
}

@override@JsonKey(name: 'monto_neto') final  double montoNeto;
@override final  String estado;

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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValorizationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.periodo, periodo) || other.periodo == periodo)&&(identical(other.montoBruto, montoBruto) || other.montoBruto == montoBruto)&&const DeepCollectionEquality().equals(other._deducciones, _deducciones)&&(identical(other.montoNeto, montoNeto) || other.montoNeto == montoNeto)&&(identical(other.estado, estado) || other.estado == estado));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,periodo,montoBruto,const DeepCollectionEquality().hash(_deducciones),montoNeto,estado);

@override
String toString() {
  return 'ValorizationModel(id: $id, periodo: $periodo, montoBruto: $montoBruto, deducciones: $deducciones, montoNeto: $montoNeto, estado: $estado)';
}


}

/// @nodoc
abstract mixin class _$ValorizationModelCopyWith<$Res> implements $ValorizationModelCopyWith<$Res> {
  factory _$ValorizationModelCopyWith(_ValorizationModel value, $Res Function(_ValorizationModel) _then) = __$ValorizationModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String periodo,@JsonKey(name: 'monto_bruto') double montoBruto, Map<String, double> deducciones,@JsonKey(name: 'monto_neto') double montoNeto, String estado
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
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? periodo = null,Object? montoBruto = null,Object? deducciones = null,Object? montoNeto = null,Object? estado = null,}) {
  return _then(_ValorizationModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,periodo: null == periodo ? _self.periodo : periodo // ignore: cast_nullable_to_non_nullable
as String,montoBruto: null == montoBruto ? _self.montoBruto : montoBruto // ignore: cast_nullable_to_non_nullable
as double,deducciones: null == deducciones ? _self._deducciones : deducciones // ignore: cast_nullable_to_non_nullable
as Map<String, double>,montoNeto: null == montoNeto ? _self.montoNeto : montoNeto // ignore: cast_nullable_to_non_nullable
as double,estado: null == estado ? _self.estado : estado // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
