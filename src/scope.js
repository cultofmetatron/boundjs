"use strict";

(function(global){

  global.B.scope = {
    _namespace: window,

    extend: function(obj){
      return _.defaults({
        _parent: this,
        _namespace: obj,
        namespace: function(){
          return this._namespace;
        }
      }, B.scope);
    },

    index: function(index){
      // todo: this should probably fall through to the first arraylike namespace, and shouldn't look up on any namespaces above or below it
      return this._findInScope(index);
    },

    _findInScope: function(key){
      return B(this._namespace).has(key) ? B(this._namespace).get(key) : this._parent && this._parent._findInScope(key);
    },

    lookup: function(json){
      var i = 0;
      var that = this;

      var consume = function(expected){
        var char = peek();
        _.raiseIf(expected && char !== expected, "Expected " + char + " to be " + expected);
        i++;
        return char;
      };

      var peek = function(){
        return json[i];
      };

      var consumeValue = function(){
        consumeSpace();
        return (
          parsers[peek()] ? parsers[peek()]() :
          /\d|\-/.test(peek()) ? consumeNumber() :
          /\w|\_|\$/.test(peek()) ? consumeName() :
          _.raise('Bad Value')
        );
      };

      var consumeSpace = function(){
        while(peek() === ' '){
          consume(' ');
        }
      };

      var consumeNumber = function(){
        var result = '';
        while(/\d|\.|\-/.test(peek())){
          result += consume();
        }
        return +result;
      };

      var keywords = {
        'null': null,
        'true': true,
        'false': false,
        'undefined': undefined
      };

      var consumeName = function(){
        var key = parseName();
        return key in keywords ? keywords[key] : that._findInScope(key);
      };

      var parseName = function(){
        var result = '';
        while(/\w|\d|\_|\$/.test(peek()) && peek()){
          result += consume();
        }
        return result;
      };

      var consumeHash = function(){
        var result = {};
        var key;
        consume('{');
        consumeSpace();
        if(peek() === '}'){
          consume('}');
          return result;
        }
        while(peek()){
          key = /\"|\'/.test(peek()) ? consumeString() : parseName();
          consumeSpace();
          consume(':');
          consumeSpace();
          result[key] = consumeValue();
          if(peek() === ','){
            consumeSpace();
            consume(',');
            consumeSpace();
          }
          if(peek() === '}'){
            consume('}');
            break;
          }
        }
        return result;
      };

      var consumeString = function(){
        var result = '';
        var delimiter = consume();
        _.raiseIf('\'"'.indexOf(delimiter) === -1, 'bad string');
        while(peek()){
          result += consume();
          if(peek() === '\\'){
            consume();
            result += consume();
          }
          if(peek() === delimiter){
            consume();
            consumeSpace();
            return result;
          }
        }
        throw new Error("Bad string");
      };

      var consumeArray = function(){
        var result = [];
        consume('[');
        consumeSpace();
        if(peek() === ']'){
          consume(']');
          return result;
        }
        while(peek()){
          result.push(consumeValue());
          if(peek() === ']'){
            consume(']');
            return result;
          }
          consume(',');
          consumeSpace();
        }
        throw new Error("Bad array");
      };

      var parsers = {
        '[': consumeArray,
        '{': consumeHash,
        '"': consumeString,
        "'": consumeString,
        ' ': consumeSpace
      };

      return consumeValue();
    }
  };

}(this));
